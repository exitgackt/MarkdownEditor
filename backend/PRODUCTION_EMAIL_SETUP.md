# 本番環境用メール設定ガイド

## SendGrid セットアップ（本番推奨）

### 1. SendGridアカウント作成

1. https://sendgrid.com/ にアクセス
2. 「Start for Free」をクリック
3. アカウント情報を入力して登録
4. メール認証を完了

**無料プラン:**
- 100通/日まで無料
- クレジットカード登録不要

---

### 2. API キーの取得

1. SendGridダッシュボードにログイン
2. **Settings** → **API Keys** をクリック
3. **Create API Key** をクリック
4. 名前を入力（例: `MarkdownEditor-Production`）
5. **Restricted Access** を選択:
   - **Mail Send** → **Full Access** にチェック
6. **Create & View** をクリック
7. **APIキーをコピー**（この画面でしか表示されないので注意！）

---

### 3. 送信元メールアドレスの認証

#### 方法A: 単一送信者認証（簡単）

1. **Settings** → **Sender Authentication** → **Single Sender Verification**
2. **Create New Sender** をクリック
3. 情報を入力:
   - From Name: `Markdown Editor`
   - From Email Address: `noreply@yourdomain.com`（または個人メール）
   - Reply To: 同じメールアドレス
   - 会社名、住所などを入力
4. **Create** をクリック
5. 認証メールが届くので、リンクをクリックして確認

#### 方法B: ドメイン認証（推奨、独自ドメイン必要）

1. **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. ドメインプロバイダーを選択（例: Cloudflare, GoDaddy）
3. ドメイン名を入力（例: `yourdomain.com`）
4. 表示されたDNSレコードをドメインのDNS設定に追加:
   - CNAME レコード × 3
5. 「Verify」をクリックして認証完了を確認

---

### 4. 環境変数の設定

**本番環境の `.env` を編集:**

```env
# Email/SMTP - SendGrid設定
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**重要なポイント:**
- `SMTP_USER` は必ず `apikey` という文字列（固定値）
- `SMTP_PASSWORD` には取得したSendGridのAPIキーを設定
- `SMTP_FROM_EMAIL` は認証済みのメールアドレスを使用

---

### 5. バックエンドを再起動

```bash
cd backend

# 既存プロセスを停止
./scripts/dev_tools.sh restart-backend

# または手動で
pkill -f "uvicorn app.main:app"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### 6. テスト送信

#### 方法1: 登録フローでテスト

1. 新規ユーザー登録
2. **実際のメールアドレス**を使用
3. 受信トレイを確認
4. 検証リンクをクリック

#### 方法2: コマンドラインでテスト

```bash
cd backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from app.services.email_service import email_service

async def test_email():
    success = await email_service.send_verification_email(
        email="your-test-email@example.com",
        token="test-token-12345"
    )
    if success:
        print("✅ メール送信成功！受信トレイを確認してください")
    else:
        print("❌ メール送信失敗")

asyncio.run(test_email())
EOF
```

---

## 🔍 トラブルシューティング

### 問題1: メールが届かない

**確認事項:**
1. 迷惑メールフォルダをチェック
2. SendGridダッシュボードで送信ログを確認:
   - **Activity** → **Email Activity**
3. 送信元メールアドレスが認証済みか確認

**解決策:**
- From EmailをSendGridで認証済みのアドレスに変更
- SPF/DKIMレコードが正しく設定されているか確認

---

### 問題2: 認証エラー

```
smtplib.SMTPAuthenticationError: (535, b'Authentication failed: Bad username / password')
```

**原因:**
- APIキーが間違っている
- `SMTP_USER` が `apikey` になっていない

**解決策:**
```bash
# .envを確認
cat backend/.env | grep SMTP

# 正しい設定:
SMTP_USER=apikey  # ← 必ず "apikey" という文字列
SMTP_PASSWORD=SG.xxx  # ← APIキー全体
```

---

### 問題3: レート制限エラー

```
Too Many Requests (429)
```

**原因:**
- 無料プランの送信上限（100通/日）に到達

**解決策:**
- 翌日まで待つ
- 有料プランにアップグレード
- 開発・テスト時は `.env` の `SMTP_HOST` を空にして開発モードに戻す

---

## 📊 SendGrid ダッシュボードの活用

### 送信統計の確認

**Stats** → **Overview** で以下を確認:
- 送信数
- 配信率
- 開封率
- クリック率
- バウンス率

### メールテンプレート（オプション）

SendGridの動的テンプレート機能を使うと、HTMLメールを送信できます:

1. **Email API** → **Dynamic Templates** → **Create a Dynamic Template**
2. テンプレートをデザイン
3. Template IDを取得
4. コードでTemplate IDを指定して送信

**メリット:**
- プロフェッショナルなデザイン
- 変数の埋め込み
- コードとデザインの分離

---

## 🔐 セキュリティのベストプラクティス

1. **APIキーの管理:**
   - `.env` ファイルを `.gitignore` に追加（既に対応済み）
   - 環境変数として管理
   - 定期的にAPIキーをローテーション

2. **送信元ドメイン:**
   - 本番では独自ドメインを使用
   - SPF/DKIM/DMARCレコードを設定

3. **レート制限:**
   - アプリケーション側でもレート制限を設定（既に実装済み）
   - SendGridの送信上限を監視

---

## 💰 料金プラン

| プラン | 送信数/月 | 料金 |
|--------|----------|------|
| Free | 100/日 (3,000/月) | $0 |
| Essentials | 50,000/月 | $19.95/月 |
| Pro | 100,000/月 | $89.95/月 |

**推奨:**
- 開発・テスト: Free プラン
- 小規模本番: Essentials プラン
- 大規模本番: Pro プラン

---

## ✅ 本番公開前チェックリスト

### メール設定
- [ ] SendGridアカウント作成
- [ ] APIキー取得
- [ ] 送信元メールアドレス認証
- [ ] `.env` に設定追加
- [ ] テスト送信成功

### その他の本番準備
- [ ] データベースをPostgreSQLに移行
- [ ] `DEBUG=False` に設定
- [ ] `SECRET_KEY` を強力なものに変更
- [ ] `ALLOWED_ORIGINS` を本番URLに設定
- [ ] HTTPSを有効化
- [ ] Google OAuth 本番認証情報に変更

---

## 📚 参考リンク

- SendGrid公式ドキュメント: https://docs.sendgrid.com/
- SendGrid Python SDK: https://github.com/sendgrid/sendgrid-python
- SMTP設定ガイド: https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

---

**このドキュメントを保存しておき、本番公開前に設定を行ってください！**
