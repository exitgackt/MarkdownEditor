#!/bin/bash

set -e

PROJECT_ID="project-926c918a-d42a-4ba3-a37"
REGION="asia-southeast1"
SERVICE_NAME="markdown-editor-backend"
IMAGE="gcr.io/project-926c918a-d42a-4ba3-a37/markdown-editor-api:latest"

# 環境変数を設定
ENV_DATABASE_URL="postgresql://neondb_owner:npg_b3s8NkCzEtIZ@ep-broad-hill-a1jlpoeh-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ENV_SECRET_KEY="186bc4448b013db447b3eae27bd4da23bf16455a9a05bf77b533b964b873284c"
ENV_ALGORITHM="HS256"
ENV_ACCESS_TOKEN_EXPIRE_MINUTES="1440"
ENV_DEBUG="False"
ENV_FRONTEND_URL="http://localhost:5177"
ENV_INITIAL_ADMIN_EMAILS="admin@example.com"

echo "Cloud Run に環境変数を設定してデプロイ中..."

# 各環境変数を個別に設定
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --project="$PROJECT_ID" \
  --update-env-vars="DATABASE_URL=$ENV_DATABASE_URL" \
  --update-env-vars="SECRET_KEY=$ENV_SECRET_KEY" \
  --update-env-vars="ALGORITHM=$ENV_ALGORITHM" \
  --update-env-vars="ACCESS_TOKEN_EXPIRE_MINUTES=$ENV_ACCESS_TOKEN_EXPIRE_MINUTES" \
  --update-env-vars="DEBUG=$ENV_DEBUG" \
  --update-env-vars="FRONTEND_URL=$ENV_FRONTEND_URL" \
  --update-env-vars="INITIAL_ADMIN_EMAILS=$ENV_INITIAL_ADMIN_EMAILS"

echo "✅ デプロイ成功！"

# デプロイされたサービスのURL取得
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --platform=managed \
  --format='value(status.url)' \
  --project="$PROJECT_ID")

echo "🚀 バックエンド URL: $SERVICE_URL"
