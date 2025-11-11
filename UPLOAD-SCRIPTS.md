# Upload Scripts Documentation

This project includes two upload scripts for uploading files to R2 storage in both development and production environments.

## Scripts Overview

### 1. `upload-large-r2.sh` - AWS CLI Method
Uses AWS CLI with S3-compatible commands for direct R2 uploads. Best for large files (>100MB).

**Usage:**
```bash
./upload-large-r2.sh <environment> <file-path> [destination-name]
```

**Examples:**
```bash
# Upload to development environment
./upload-large-r2.sh dev ~/Documents/largefile.zip

# Upload to production with custom name
./upload-large-r2.sh prod ~/Documents/largefile.zip uploads/renamed-file.zip
```

**Requirements:**
- AWS CLI configured with R2 profiles:
  - `r2-dev` for development
  - `r2-prod` for production

### 2. `simple-r2-upload.sh` - Worker Proxy Method
Uses the application's worker proxy endpoints. Simpler setup, works with existing authentication.

**Usage:**
```bash
./simple-r2-upload.sh <environment> <file-path>
```

**Examples:**
```bash
# Upload to development
./simple-r2-upload.sh dev ~/Documents/myfile.txt

# Upload to production
./simple-r2-upload.sh prod ~/Documents/myfile.txt
```

## Environment Configuration

### Development (`dev`)
- **Bucket**: `ez-westcor-downloads-dev`
- **URL**: `https://ez-westcor-dev.urbantechdc.com`
- **AWS Profile**: `r2-dev`

### Production (`prod`)
- **Bucket**: `ez-westcor-downloads-prod`
- **URL**: `https://ez-westcor.throbbing-smoke-3f62.workers.dev`
- **AWS Profile**: `r2-prod`

## Setup Instructions

### For AWS CLI Method
1. Configure development profile:
   ```bash
   aws configure --profile r2-dev
   ```

2. Configure production profile:
   ```bash
   aws configure --profile r2-prod
   ```

### For Worker Proxy Method
- No additional setup required
- Uses existing Zero Trust authentication

## Choosing the Right Method

- **Use `upload-large-r2.sh`** for:
  - Large files (>100MB)
  - Batch uploads
  - When you need fine control over upload parameters

- **Use `simple-r2-upload.sh`** for:
  - Quick uploads
  - Smaller files
  - When AWS CLI setup is problematic
  - Development testing