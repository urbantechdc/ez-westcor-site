#!/bin/bash

# Simple R2 Upload Script
# Usage: ./r2-upload.sh <file> [destination-path]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file-path> [destination-path]"
    echo "Example: $0 myfile.txt"
    echo "Example: $0 myfile.txt uploads/myfile.txt"
    exit 1
fi

FILE_PATH="$1"
DEST_PATH="${2:-$(basename "$FILE_PATH")}"

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

# Set R2 credentials (no profile needed)
export AWS_ACCESS_KEY_ID="c881017c8b0a7fae84068f1140cdeec7"
export AWS_SECRET_ACCESS_KEY="3c6c2cf6005972c5295fbfaed662e6aa320cd90cf1bf884b5ebc7af2164b17fb"
export AWS_DEFAULT_REGION="auto"

# Upload to R2
echo "🚀 Uploading $FILE_PATH to R2..."
aws s3 cp "$FILE_PATH" "s3://ez-westcor-downloads-dev/$DEST_PATH" \
  --endpoint-url https://002eeeed45cd3092f9850997d62be37b.r2.cloudflarestorage.com

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
    echo "📁 File location: s3://ez-westcor-downloads-dev/$DEST_PATH"
else
    echo "❌ Upload failed!"
fi