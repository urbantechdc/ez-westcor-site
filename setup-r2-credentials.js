#!/usr/bin/env node

/**
 * Setup script for R2 credentials for presigned URLs
 *
 * This script helps you configure R2 API tokens for the presigned URL functionality.
 * You need to create R2 API tokens in the Cloudflare dashboard first.
 */

import { execSync } from 'child_process';

console.log('🔧 R2 Presigned URL Setup');
console.log('==========================================\n');

console.log('📋 Step 1: Create R2 API tokens in Cloudflare Dashboard');
console.log('   1. Go to https://dash.cloudflare.com/profile/api-tokens');
console.log('   2. Click "Create Token"');
console.log('   3. Use "Custom token" template');
console.log('   4. Configure:');
console.log('      - Token name: "R2 Presigned URLs"');
console.log('      - Permissions: Cloudflare R2:Edit');
console.log('      - Account Resources: Include - Your Account');
console.log('      - Zone Resources: Include - All zones');
console.log('   5. Click "Continue to summary" then "Create Token"');
console.log('   6. Copy the Access Key ID and Secret Access Key\n');

console.log('📋 Step 2: Set up environment variables for development');
console.log('   Run these commands with your actual credentials:\n');

console.log('   # Development environment');
console.log('   wrangler secret put R2_ACCESS_KEY_ID --env dev');
console.log('   wrangler secret put R2_SECRET_ACCESS_KEY --env dev\n');

console.log('📋 Step 3: Set up environment variables for production');
console.log('   wrangler secret put R2_ACCESS_KEY_ID --env prod');
console.log('   wrangler secret put R2_SECRET_ACCESS_KEY --env prod\n');

console.log('📋 Step 4: Test the configuration');
console.log('   npm run test-presigned-upload\n');

console.log('⚠️  Important Notes:');
console.log('   - Keep your API credentials secure');
console.log('   - Don\'t commit credentials to git');
console.log('   - R2 API tokens are different from Cloudflare API tokens');
console.log('   - The account ID is already configured in the code\n');

// Check if wrangler is available
try {
    const version = execSync('wrangler --version', { encoding: 'utf8' });
    console.log(`✅ Wrangler detected: ${version.trim()}`);
} catch (error) {
    console.log('❌ Wrangler not found. Please install: npm install -g wrangler');
    process.exit(1);
}

console.log('\n🚀 Ready to set up R2 credentials!');
console.log('   After setting the secrets, run: ./build.sh --deploy-dev');