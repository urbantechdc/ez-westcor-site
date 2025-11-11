# Getting R2 S3-Compatible Credentials

You need **R2 S3-compatible credentials**, not Cloudflare API tokens.

## Step-by-Step Guide

### 1. Go to R2 Object Storage
- Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
- Click **"R2 Object Storage"** in the left sidebar

### 2. Create API Token for R2
- Click **"Manage R2 API tokens"** (top right of R2 page)
- Click **"Create API token"**

### 3. Configure Token Settings
- **Token name**: `R2 Presigned URLs`
- **Permissions**:
  - ✅ **Object Read**
  - ✅ **Object Write**
- **TTL**: Custom (set to 1 year or whatever you prefer)
- **Bucket permissions**: Either "All buckets" or select your specific bucket

### 4. Generate Token
- Click **"Create API Token"**
- You'll see a screen with:
  - ✅ **Access Key ID** (starts with something like `f1a2b3c4...`)
  - ✅ **Secret Access Key** (longer string)
  - ~~Bearer Token~~ (not needed for presigned URLs)

### 5. Copy the Credentials
**Save these two values:**
- **Access Key ID**: `f1a2b3c4d5e6f7g8h9i0j1k2`
- **Secret Access Key**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

### 6. Set Environment Variables
```bash
echo "YOUR_ACCESS_KEY_ID" | wrangler secret put R2_ACCESS_KEY_ID --env dev
echo "YOUR_SECRET_ACCESS_KEY" | wrangler secret put R2_SECRET_ACCESS_KEY --env dev
```

## What You Have vs. What You Need

| What You Got | What We Need |
|--------------|--------------|
| Bearer Token (API access) | ❌ Not for S3 operations |
| Access Key ID | ✅ **This is what we need** |
| Secret Access Key | ✅ **This is what we need** |

## Quick Test
Once you have the credentials set:
```bash
npm run test:presigned-upload
```

## Still Having Issues?
The R2 API token creation page sometimes shows different interfaces. Look for:
- **"S3 API credentials"**
- **"Access Key"** and **"Secret Key"**
- **"Object Read/Write permissions"**