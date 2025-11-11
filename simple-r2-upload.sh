#!/bin/bash

# Simple R2 Upload via Worker Proxy
# This bypasses all AWS CLI issues by using your working web app

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file-path>"
    echo "Example: $0 myfile.txt"
    exit 1
fi

FILE_PATH="$1"
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

FILENAME=$(basename "$FILE_PATH")
CONTENT_TYPE=$(file -b --mime-type "$FILE_PATH")
FILE_SIZE=$(wc -c < "$FILE_PATH")

echo "📁 File: $FILENAME"
echo "📏 Size: $FILE_SIZE bytes"
echo "📋 Type: $CONTENT_TYPE"
echo ""

# Step 1: Get presigned URL
echo "🔗 Getting upload URL..."
RESPONSE=$(curl -s -X POST https://ez-westcor-dev.urbantechdc.com/api/uploads/presigned-url \
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

FULL_PROXY_URL="https://ez-westcor-dev.urbantechdc.com$PROXY_URL"
echo "📍 Upload URL: $FULL_PROXY_URL"

# Step 2: Upload via worker proxy
echo "🚀 Uploading..."
curl -X PUT "$FULL_PROXY_URL" \
  -H "Content-Type: $CONTENT_TYPE" \
  --data-binary "@$FILE_PATH" \
  --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
    echo "📦 File uploaded to R2 bucket: ez-westcor-downloads-dev"
else
    echo "❌ Upload failed"
fi