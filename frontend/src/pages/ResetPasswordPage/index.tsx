import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // ページ遷移時にエラーをクリア
    clearError();
  }, [clearError]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'パスワードは8文字以上である必要があります';
    }
    if (!/[A-Z]/.test(password)) {
      return 'パスワードには大文字を含める必要があります';
    }
    if (!/[a-z]/.test(password)) {
      return 'パスワードには小文字を含める必要があります';
    }
    if (!/\d/.test(password)) {
      return 'パスワードには数字を含める必要があります';
    }
    return null;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    clearError();

    if (!email) {
      setFormError('メールアドレスを入力してください');
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setSuccessMessage('パスワードリセットメールを送信しました。メールを確認してください。');
      setEmail('');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    clearError();

    if (!newPassword || !confirmPassword) {
      setFormError('すべてのフィールドを入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('パスワードが一致しません');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (!token) {
      setFormError('無効なリセットトークンです');
      return;
    }

    const success = await resetPassword(token, newPassword);
    if (success) {
      setSuccessMessage('パスワードがリセットされました。ログインしてください。');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  // トークンがある場合は新しいパスワード入力フォーム
  if (token) {
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
        <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                新しいパスワードの設定
              </Typography>
            </Box>

            {(error || formError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || formError}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box component="form" onSubmit={handleResetPassword}>
                <TextField
                  fullWidth
                  label="新しいパスワード"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                  helperText="8文字以上、大文字・小文字・数字を含む"
                  data-testid="new-password-input"
                  inputProps={{ 'data-testid': 'new-password-input-field' }}
                />
                <TextField
                  fullWidth
                  label="新しいパスワード（確認）"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                  data-testid="password-confirm-input"
                  inputProps={{ 'data-testid': 'password-confirm-input-field' }}
                />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mb: 2 }} data-testid="reset-password-button">
                  パスワードをリセット
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <MuiLink component={Link} to="/login" variant="body2">
                    ログインページへ
                  </MuiLink>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // トークンがない場合はメールアドレス入力フォーム
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
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              パスワードリセット
            </Typography>
            <Typography variant="body2" color="text.secondary">
              登録したメールアドレスを入力してください
            </Typography>
          </Box>

          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || formError}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleForgotPassword}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                required
                data-testid="reset-email-input"
                inputProps={{ 'data-testid': 'reset-email-input-field' }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mb: 2 }} data-testid="reset-send-button">
                リセットメールを送信
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <MuiLink component={Link} to="/login" variant="body2">
                  ログインページへ
                </MuiLink>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
