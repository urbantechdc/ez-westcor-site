#!/bin/bash

# R2 Upload Script
# Usage: ./upload-to-r2.sh <file-path> [destination-name]

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file-path> [destination-name]"
    echo "Example: $0 myfile.zip"
    echo "Example: $0 myfile.zip uploads/renamed-file.zip"
    exit 1
fi

FILE_PATH="$1"
DEST_NAME="${2:-$(basename "$FILE_PATH")}"
BUCKET="ez-westcor-downloads-dev"
ENDPOINT="https://002eeeed45cd3092f9850997d62be37b.r2.cloudflarestorage.com"

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

echo "📁 Uploading: $FILE_PATH"
echo "📍 Destination: s3://$BUCKET/$DEST_NAME"
echo "🔗 Endpoint: $ENDPOINT"

# Check if AWS CLI is configured for R2
if ! aws configure list --profile r2-dev > /dev/null 2>&1; then
    echo "❌ AWS CLI profile 'r2-dev' not configured"
    echo "Run: aws configure --profile r2-dev"
    exit 1
fi

# Upload file
aws s3 cp "$FILE_PATH" "s3://$BUCKET/$DEST_NAME" \
    --endpoint-url "$ENDPOINT" \
    --profile r2-dev \
    --no-progress

echo "✅ Upload complete!"
echo "📋 File info:"
aws s3 ls "s3://$BUCKET/$DEST_NAME" \
    --endpoint-url "$ENDPOINT" \
    --profile r2-dev \
    --human-readable