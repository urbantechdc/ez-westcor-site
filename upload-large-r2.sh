#!/bin/bash

# Large File R2 Upload Script - Optimized for big files
# Usage: ./upload-large-r2.sh <environment> <file-path> [destination-name]

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <environment> <file-path> [destination-name]"
    echo "Environment: dev or prod"
    echo "Example: $0 dev ~/Desktop/largefile.zip"
    echo "Example: $0 prod ~/Desktop/largefile.zip uploads/renamed-file.zip"
    exit 1
fi

ENVIRONMENT="$1"
FILE_PATH="$2"
DEST_NAME="${3:-$(basename "$FILE_PATH")}"

# Set environment-specific configuration
if [ "$ENVIRONMENT" = "dev" ]; then
    BUCKET="ez-westcor-downloads-dev"
    AWS_PROFILE="r2-dev"
    ENV_NAME="Development"
elif [ "$ENVIRONMENT" = "prod" ]; then
    BUCKET="ez-westcor-downloads-prod"
    AWS_PROFILE="r2-prod"
    ENV_NAME="Production"
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, prod"
    exit 1
fi

ENDPOINT="https://002eeeed45cd3092f9850997d62be37b.r2.cloudflarestorage.com"

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

# Get file size for display
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "unknown")
FILE_SIZE_HUMAN=$(ls -lh "$FILE_PATH" | awk '{print $5}')

echo "🌍 Environment: $ENV_NAME ($ENVIRONMENT)"
echo "📁 Uploading: $FILE_PATH"
echo "📏 Size: $FILE_SIZE_HUMAN ($FILE_SIZE bytes)"
echo "📍 Destination: s3://$BUCKET/$DEST_NAME"
echo "🔗 Endpoint: $ENDPOINT"
echo ""

# Check if AWS CLI is configured for R2
if ! aws configure list --profile "$AWS_PROFILE" > /dev/null 2>&1; then
    echo "❌ AWS CLI profile '$AWS_PROFILE' not configured"
    echo "Run: aws configure --profile $AWS_PROFILE"
    exit 1
fi

# Configure multipart settings for better large file handling
echo "🚀 Starting upload with optimized settings..."

# Use larger chunk sizes and show progress
aws configure set default.s3.max_concurrent_requests 10 --profile "$AWS_PROFILE"
aws configure set default.s3.multipart_threshold 64MB --profile "$AWS_PROFILE"
aws configure set default.s3.multipart_chunksize 16MB --profile "$AWS_PROFILE"
aws configure set default.cli_read_timeout 0 --profile "$AWS_PROFILE"
aws configure set default.cli_read_timeout 300 --profile "$AWS_PROFILE"

# Upload with progress and better error handling
aws s3 cp "$FILE_PATH" "s3://$BUCKET/$DEST_NAME" \
    --endpoint-url "$ENDPOINT" \
    --profile "$AWS_PROFILE" \
    --cli-read-timeout 300 \
    --cli-connect-timeout 60

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload complete!"
    echo "📋 Verifying file..."
    aws s3 ls "s3://$BUCKET/$DEST_NAME" \
        --endpoint-url "$ENDPOINT" \
        --profile "$AWS_PROFILE" \
        --human-readable

    echo ""
    echo "🎉 File successfully uploaded to R2!"
    echo "📦 Location: s3://$BUCKET/$DEST_NAME"
else
    echo ""
    echo "❌ Upload failed!"
    echo "💡 Try again or use a smaller chunk size"
    exit 1
fi