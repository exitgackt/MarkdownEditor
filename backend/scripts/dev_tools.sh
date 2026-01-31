#!/bin/bash
# 開発用ツールスクリプト

cd "$(dirname "$0")/.."
source venv/bin/activate

case "$1" in
  clear-rate-limit)
    echo "レート制限をクリア中..."
    python3 -c "
from app.core.rate_limit import rate_limiter
rate_limiter.registration_attempts.clear()
rate_limiter.login_attempts.clear()
print('✅ レート制限をクリアしました')
"
    ;;

  check-rate-limit)
    echo "=== レート制限の状況 ==="
    python3 -c "
from app.core.rate_limit import rate_limiter
from datetime import datetime

print(f'現在時刻: {datetime.utcnow()}\n')
print(f'登録試行記録: {len(rate_limiter.registration_attempts)} 件')
for ip, attempts in rate_limiter.registration_attempts.items():
    print(f'  IP {ip}: {len(attempts)} 回')

print(f'\nログイン試行記録: {len(rate_limiter.login_attempts)} 件')
for ip, attempts in rate_limiter.login_attempts.items():
    print(f'  IP {ip}: {len(attempts)} 回')
"
    ;;

  get-verification-url)
    echo "=== 最新の検証URL ==="
    python3 -c "
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email_verified == False).order_by(User.created_at.desc()).first()
if user and user.email_verification_token:
    print(f'Email: {user.email}')
    print(f'URL: http://localhost:5173/verify-email?token={user.email_verification_token}')
else:
    print('未検証のユーザーが見つかりません')
db.close()
"
    ;;

  list-users)
    echo "=== ユーザー一覧 ==="
    python3 -c "
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for user in users:
    verified = '✓' if user.email_verified else '✗'
    admin = '[管理者]' if user.is_admin else ''
    print(f'{verified} {user.email} ({user.auth_provider}) {admin}')
db.close()
"
    ;;

  restart-backend)
    echo "バックエンドを再起動中..."
    # 既存プロセスを停止
    pkill -f "uvicorn app.main:app" 2>/dev/null
    sleep 1
    # 起動
    nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    echo "PID: $!"
    sleep 2
    curl -s http://localhost:8000/health && echo -e "\n✅ バックエンドが起動しました"
    ;;

  *)
    echo "使用方法: $0 {clear-rate-limit|check-rate-limit|get-verification-url|list-users|restart-backend}"
    echo ""
    echo "コマンド:"
    echo "  clear-rate-limit      - レート制限をクリア"
    echo "  check-rate-limit      - レート制限の状況を確認"
    echo "  get-verification-url  - 最新の検証URLを取得"
    echo "  list-users            - ユーザー一覧を表示"
    echo "  restart-backend       - バックエンドを再起動"
    exit 1
    ;;
esac
