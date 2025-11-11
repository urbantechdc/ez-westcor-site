#!/usr/bin/env node

/**
 * Test script for presigned URL upload functionality
 *
 * This tests the complete presigned upload flow:
 * 1. Generate presigned upload URL
 * 2. Upload file directly to R2 using the presigned URL
 * 3. Create download code for the uploaded file
 */

import fs from 'fs';
import path from 'path';

const API_BASE = 'https://ez-westcor-dev.throbbing-smoke-3f62.workers.dev';
const AUTH_EMAIL = 'matt@easyharvest.ai';

async function testPresignedUpload() {
    const filePath = './archive.zip';
    const fileName = 'archive.zip';

    console.log('🧪 Testing Presigned URL Upload');
    console.log('================================\n');

    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        console.log('   Please ensure archive.zip exists in the current directory');
        return;
    }

    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const contentType = 'application/zip';

    console.log(`📁 File: ${fileName}`);
    console.log(`📏 Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🏷️  Type: ${contentType}\n`);

    try {
        // Step 1: Generate presigned upload URL
        console.log('1️⃣ Generating presigned upload URL...');

        const presignedResponse = await fetch(`${API_BASE}/api/uploads/presigned-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-authenticated-user-email': AUTH_EMAIL
            },
            body: JSON.stringify({
                fileName: fileName,
                contentType: contentType,
                fileSize: fileSize.toString()
            })
        });

        if (!presignedResponse.ok) {
            const error = await presignedResponse.text();
            console.error('❌ Failed to generate presigned URL:', presignedResponse.status);
            console.error('   Error:', error);
            return;
        }

        const presignedData = await presignedResponse.json();
        console.log('✅ Presigned URL generated successfully');
        console.log(`   File Key: ${presignedData.fileKey}`);
        console.log(`   Expires in: ${presignedData.expiresIn} seconds\n`);

        // Step 2: Upload file using presigned URL
        console.log('2️⃣ Uploading file to R2...');

        const fileBuffer = fs.readFileSync(filePath);

        const uploadResponse = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileSize.toString()
            },
            body: fileBuffer
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            console.error('❌ Failed to upload file:', uploadResponse.status);
            console.error('   Error:', error);
            return;
        }

        console.log('✅ File uploaded successfully to R2\n');

        // Step 3: Create download code
        console.log('3️⃣ Creating download code...');

        const downloadCodeResponse = await fetch(`${API_BASE}/api/downloads/admin/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-authenticated-user-email': AUTH_EMAIL
            },
            body: JSON.stringify({
                fileKey: presignedData.fileKey,
                recipientEmail: AUTH_EMAIL
            })
        });

        if (!downloadCodeResponse.ok) {
            const error = await downloadCodeResponse.text();
            console.error('❌ Failed to create download code:', downloadCodeResponse.status);
            console.error('   Error:', error);
            return;
        }

        const downloadData = await downloadCodeResponse.json();
        console.log('✅ Download code created successfully');
        console.log(`   Code: ${downloadData.code}`);
        console.log(`   File: ${downloadData.file_name}`);
        console.log(`   Size: ${(downloadData.file_size / 1024 / 1024).toFixed(2)} MB\n`);

        // Step 4: Test download validation
        console.log('4️⃣ Testing download validation...');

        const validateResponse = await fetch(`${API_BASE}/api/downloads/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-authenticated-user-email': AUTH_EMAIL
            },
            body: JSON.stringify({
                code: downloadData.code
            })
        });

        if (!validateResponse.ok) {
            const error = await validateResponse.text();
            console.error('❌ Failed to validate download code:', validateResponse.status);
            console.error('   Error:', error);
            return;
        }

        const validateData = await validateResponse.json();
        console.log('✅ Download code validated successfully');
        console.log(`   Download URL: ${API_BASE}${validateData.download.download_url}\n`);

        console.log('🎉 Presigned Upload Test Completed Successfully!');
        console.log('=====================================');
        console.log(`📋 Summary:`);
        console.log(`   - File uploaded: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`   - Download code: ${downloadData.code}`);
        console.log(`   - Ready for download via the web interface`);

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('   Please check your R2 credentials are configured correctly');
    }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testPresignedUpload();
}