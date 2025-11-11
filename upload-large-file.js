#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

async function uploadLargeFile() {
    const filePath = './archive.zip';
    const fileName = 'archive.zip';

    console.log('🚀 Starting upload of archive.zip...');

    const fileStats = fs.statSync(filePath);
    console.log(`📁 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    try {
        // First, deploy the upload endpoint
        console.log('📦 Deploying upload endpoint...');
        execSync('./build.sh --deploy-dev', { stdio: 'inherit' });

        // Create form data with the file

        const form = new FormData();
        const file = await fileFromPath(filePath, 'archive.zip', { type: 'application/zip' });
        form.append('file', file);

        console.log('⬆️ Uploading file...');

        // Upload via our admin API endpoint
        const response = await fetch('https://ez-westcor-dev.throbbing-smoke-3f62.workers.dev/api/uploads/large-file', {
            method: 'POST',
            headers: {
                'x-authenticated-user-email': 'matt@easyharvest.ai'
            },
            body: form
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Upload successful!');
            console.log('📋 Response:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Upload failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('💥 Error details:', errorText);
        }
    } catch (error) {
        console.error('💥 Upload error:', error);
    }
}

// Check if running directly
if (require.main === module) {
    uploadLargeFile();
}