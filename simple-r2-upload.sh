#!/bin/bash

# Simple R2 Upload via Worker Proxy
# This bypasses all AWS CLI issues by using your working web app
# Usage: ./simple-r2-upload.sh <environment> <file-path>

if [ $# -lt 2 ]; then
    echo "Usage: $0 <environment> <file-path>"
    echo "Environment: dev or prod"
    echo "Example: $0 dev myfile.txt"
    echo "Example: $0 prod myfile.txt"
    exit 1
fi

ENVIRONMENT="$1"
FILE_PATH="$2"

# Set environment-specific configuration
if [ "$ENVIRONMENT" = "dev" ]; then
    BASE_URL="https://ez-westcor-dev.urbantechdc.com"
    ENV_NAME="Development"
elif [ "$ENVIRONMENT" = "prod" ]; then
    BASE_URL="https://ez-westcor.throbbing-smoke-3f62.workers.dev"
    ENV_NAME="Production"
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, prod"
    exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

FILENAME=$(basename "$FILE_PATH")
CONTENT_TYPE=$(file -b --mime-type "$FILE_PATH")
FILE_SIZE=$(wc -c < "$FILE_PATH")

echo "🌍 Environment: $ENV_NAME ($ENVIRONMENT)"
echo "📁 File: $FILENAME"
echo "📏 Size: $FILE_SIZE bytes"
echo "📋 Type: $CONTENT_TYPE"
echo "🔗 Target: $BASE_URL"
echo ""

# Step 1: Get presigned URL
echo "🔗 Getting upload URL..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/uploads/presigned-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileName\": \"$FILENAME\",
    \"contentType\": \"$CONTENT_TYPE\",
    \"fileSize\": \"$FILE_SIZE\"
  }")

# Extract worker proxy URL (this is a simple version)
PROXY_URL=$(echo "$RESPONSE" | grep -o '/api/uploads/proxy-r2[^"]*')

if [ -z "$PROXY_URL" ]; then
    echo "❌ Failed to get upload URL"
    exit 1
fi

FULL_PROXY_URL="$BASE_URL$PROXY_URL"
echo "📍 Upload URL: $FULL_PROXY_URL"

# Step 2: Upload via worker proxy
echo "🚀 Uploading..."
curl -X PUT "$FULL_PROXY_URL" \
  -H "Content-Type: $CONTENT_TYPE" \
  --data-binary "@$FILE_PATH" \
  --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "📦 File uploaded to R2 bucket: ez-westcor-downloads-dev"
    else
        echo "📦 File uploaded to R2 bucket: ez-westcor-downloads-prod"
    fi
else
    echo "❌ Upload failed"
fi