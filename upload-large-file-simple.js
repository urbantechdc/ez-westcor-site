#!/usr/bin/env node

/**
 * Simple large file upload using chunks via the existing API
 * This approach splits large files into smaller chunks and uploads them sequentially
 */

import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks (well under 100MB Worker limit)
const API_BASE = 'https://ez-westcor-dev.throbbing-smoke-3f62.workers.dev';

async function uploadLargeFileInChunks() {
    const filePath = './archive.zip';
    const fileName = 'archive.zip';

    console.log('🚀 Starting chunked upload of archive.zip...');

    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        return;
    }

    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const numChunks = Math.ceil(fileSize / CHUNK_SIZE);

    console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 Splitting into ${numChunks} chunks of ${(CHUNK_SIZE / 1024 / 1024).toFixed(1)} MB each`);

    try {
        // Create chunks directory
        const chunksDir = './chunks';
        if (!fs.existsSync(chunksDir)) {
            fs.mkdirSync(chunksDir);
        }

        // Split file into chunks
        console.log('✂️  Splitting file into chunks...');
        const fileBuffer = fs.readFileSync(filePath);
        const chunkFiles = [];

        for (let i = 0; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, fileSize);
            const chunkBuffer = fileBuffer.slice(start, end);
            const chunkFileName = `archive.zip.part${i.toString().padStart(3, '0')}`;
            const chunkPath = path.join(chunksDir, chunkFileName);

            fs.writeFileSync(chunkPath, chunkBuffer);
            chunkFiles.push({
                path: chunkPath,
                name: chunkFileName,
                size: chunkBuffer.length,
                index: i
            });

            console.log(`  📄 Created chunk ${i + 1}/${numChunks}: ${(chunkBuffer.length / 1024 / 1024).toFixed(1)} MB`);
        }

        console.log('⬆️  Uploading chunks...');

        // Upload each chunk
        for (const chunk of chunkFiles) {
            console.log(`  🔄 Uploading ${chunk.name}...`);

            try {
                const { FormData } = await import('formdata-node');
                const { fileFromPath } = await import('formdata-node/file-from-path');

                const form = new FormData();
                const file = await fileFromPath(chunk.path, chunk.name, { type: 'application/octet-stream' });
                form.append('file', file);
                form.append('fileName', chunk.name); // Use chunk name as filename

                const response = await fetch(`${API_BASE}/api/uploads/large-file`, {
                    method: 'POST',
                    headers: {
                        'x-authenticated-user-email': 'matt@easyharvest.ai'
                    },
                    body: form
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`  ✅ ${chunk.name} uploaded successfully`);
                } else {
                    console.error(`  ❌ Failed to upload ${chunk.name}:`, response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('  💥 Error details:', errorText);
                    break;
                }
            } catch (uploadError) {
                console.error(`  💥 Upload error for ${chunk.name}:`, uploadError.message);
                break;
            }
        }

        // Cleanup chunks
        console.log('🧹 Cleaning up temporary chunks...');
        for (const chunk of chunkFiles) {
            try {
                fs.unlinkSync(chunk.path);
            } catch (err) {
                console.warn(`  ⚠️  Could not delete ${chunk.path}:`, err.message);
            }
        }

        try {
            fs.rmdirSync(chunksDir);
        } catch (err) {
            console.warn(`  ⚠️  Could not delete chunks directory:`, err.message);
        }

        console.log('✅ Chunked upload completed!');
        console.log('📋 Note: File was uploaded in chunks. You can reassemble if needed.');

    } catch (error) {
        console.error('💥 Upload error:', error);
    }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    uploadLargeFileInChunks();
}