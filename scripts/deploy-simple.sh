#!/bin/bash

set -e

PROJECT_ID="project-926c918a-d42a-4ba3-a37"
REGION="asia-southeast1"
SERVICE_NAME="markdown-editor-backend"
IMAGE="gcr.io/project-926c918a-d42a-4ba3-a37/markdown-editor-api:latest"

echo "Cloud Run にデプロイ中..."

gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --project="$PROJECT_ID"

echo "デプロイ成功！"
