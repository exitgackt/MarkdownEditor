#!/bin/bash

# ============================================================
# Markdown Editor - 本番環境デプロイスクリプト
# ============================================================

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========== Markdown Editor 本番デプロイ ==========${NC}"

# 設定
PROJECT_ID="project-926c918a-d42a-4ba3-a37"
REGION="ap-southeast-1"
SERVICE_NAME="markdown-editor-backend"
BACKEND_IMAGE_NAME="markdown-editor-api"

# 環境変数（本番用）
DATABASE_URL='postgresql://neondb_owner:npg_b3s8NkCzEtIZ@ep-broad-hill-a1jlpoeh-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
SECRET_KEY="186bc4448b013db447b3eae27bd4da23bf16455a9a05bf77b533b964b873284c"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
DEBUG="False"
FRONTEND_URL="http://localhost:5177"  # 本番URL取得後に更新
ALLOWED_ORIGINS='["http://localhost:5173","http://localhost:5177"]'
INITIAL_ADMIN_EMAILS="admin@example.com"

echo -e "${YELLOW}1. Docker イメージのビルド${NC}"
cd "$(dirname "$0")/../backend"

# Dockerイメージのビルド
docker build -t "gcr.io/${PROJECT_ID}/${BACKEND_IMAGE_NAME}:latest" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker イメージビルド成功${NC}"
else
    echo -e "${RED}❌ Docker イメージビルド失敗${NC}"
    exit 1
fi

echo -e "${YELLOW}2. GCR にイメージをプッシュ${NC}"

# GCR認証設定
gcloud auth configure-docker

# イメージプッシュ
docker push "gcr.io/${PROJECT_ID}/${BACKEND_IMAGE_NAME}:latest"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ イメージプッシュ成功${NC}"
else
    echo -e "${RED}❌ イメージプッシュ失敗${NC}"
    exit 1
fi

echo -e "${YELLOW}3. Cloud Run にデプロイ${NC}"

# Cloud Run にデプロイ（環境変数は1つの文字列として指定）
ENV_VARS="DATABASE_URL=${DATABASE_URL},SECRET_KEY=${SECRET_KEY},ALGORITHM=${ALGORITHM},ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES},DEBUG=${DEBUG},FRONTEND_URL=${FRONTEND_URL},ALLOWED_ORIGINS=['http://localhost:5173','http://localhost:5177'],INITIAL_ADMIN_EMAILS=${INITIAL_ADMIN_EMAILS}"

gcloud run deploy "${SERVICE_NAME}" \
    --image "gcr.io/${PROJECT_ID}/${BACKEND_IMAGE_NAME}:latest" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 5m \
    --max-instances 100 \
    --set-env-vars="${ENV_VARS}" \
    --project "${PROJECT_ID}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cloud Run デプロイ成功${NC}"

    # デプロイされたサービスのURL取得
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
        --region "${REGION}" \
        --platform managed \
        --format='value(status.url)' \
        --project "${PROJECT_ID}")

    echo -e "${GREEN}🚀 バックエンド URL: ${SERVICE_URL}${NC}"
    echo -e "${YELLOW}⚠️  このURLをフロントエンド環境変数に設定してください${NC}"
else
    echo -e "${RED}❌ Cloud Run デプロイ失敗${NC}"
    exit 1
fi

echo -e "${GREEN}========== デプロイ完了 ==========${NC}"
echo ""
echo "次のステップ："
echo "1. フロントエンドのデプロイ（Vercel）"
echo "2. CORS設定の更新（Vercel URLをバックエンドに設定）"
echo "3. 本番環境でのログイン確認"
