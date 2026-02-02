import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Button,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '../../stores';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginPageContent = () => {
  const navigate = useNavigate();
  const {
    loginWithGoogle,
    loginWithEmail,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    user,
    logout,
    authSettings,
    fetchAuthSettings,
  } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    // 認証設定を取得
    fetchAuthSettings();
    // ページ遷移時にエラーをクリア
    clearError();
  }, [fetchAuthSettings, clearError]);

  useEffect(() => {
    // デバッグ用: LocalStorageをクリア（一時的な措置）
    // 本番環境では削除すること
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      logout();
      window.location.href = '/';
      return;
    }
  }, [logout]);

  useEffect(() => {
    // 既に認証済みの場合はリダイレクト
    if (isAuthenticated && user) {
      // 初回ユーザー（利用規約未同意）は利用規約ページへ
      if (!user.terms_accepted) {
        navigate('/terms');
      } else {
        navigate('/editor');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    clearError();

    if (!credentialResponse.credential) {
      return;
    }

    const success = await loginWithGoogle(credentialResponse.credential);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && !currentUser.terms_accepted) {
        navigate('/terms');
      } else {
        navigate('/editor');
      }
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError('メールアドレスとパスワードを入力してください');
      return;
    }

    const success = await loginWithEmail(email, password);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && !currentUser.terms_accepted) {
        navigate('/terms');
      } else {
        navigate('/editor');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom data-testid="app-logo">
              マークダウンエディタ
            </Typography>
          </Box>

          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || formError}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* メール・パスワードログインフォーム */}
              {(authSettings?.email_enabled !== false) && (
                <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="メールアドレス"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                    data-testid="email-input"
                    inputProps={{ 'data-testid': 'email-input-field' }}
                  />
                  <TextField
                    fullWidth
                    label="パスワード"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                    data-testid="password-input"
                    inputProps={{ 'data-testid': 'password-input-field' }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mb: 2 }}
                    data-testid="login-button"
                  >
                    ログイン
                  </Button>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <MuiLink
                      component={Link}
                      to="/reset-password"
                      variant="body2"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      パスワードを忘れた方
                    </MuiLink>
                    <MuiLink component={Link} to="/register" variant="body2">
                      新規登録はこちら
                    </MuiLink>
                  </Box>
                </Box>
              )}

              {/* 区切り線 */}
              {(authSettings?.email_enabled !== false) && authSettings?.google_enabled && GOOGLE_CLIENT_ID && (
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    または
                  </Typography>
                </Divider>
              )}

              {/* Googleログイン */}
              {authSettings?.google_enabled && GOOGLE_CLIENT_ID && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }} data-testid="google-login-button">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                    />
                  </Box>
                </>
              )}

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                ログインすることで、
                <br />
                利用規約とプライバシーポリシーに同意したものとみなされます
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

const LoginPage = () => {
  // Google OAuth is optional - only wrap with provider if Client ID is configured
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginPageContent />
      </GoogleOAuthProvider>
    );
  }

  // Render without Google OAuth provider if Client ID is not configured
  return <LoginPageContent />;
};

export default LoginPage;
