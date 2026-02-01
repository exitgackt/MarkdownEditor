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
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores';

const RegisterPage = () => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    clearError();

    // バリデーション
    if (!email || !password || !confirmPassword || !name) {
      setFormError('すべてのフィールドを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('パスワードが一致しません');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    const success = await register(email, password, name);
    if (success) {
      setSuccessMessage(
        '登録が完了しました。メールに送信された確認リンクをクリックしてください。'
      );
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
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
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              新規登録
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : successMessage ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  メールを確認して検証リンクをクリックしてください。
                  <br />
                  検証が完了したらログインできます。
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  ログインページへ
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              {(error || formError) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error || formError}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                  data-testid="name-input"
                  inputProps={{ 'data-testid': 'name-input-field' }}
                />
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
                  helperText="8文字以上、大文字・小文字・数字を含む"
                  data-testid="password-input"
                  inputProps={{ 'data-testid': 'password-input-field' }}
                />
                <TextField
                  fullWidth
                  label="パスワード（確認）"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                  data-testid="password-confirm-input"
                  inputProps={{ 'data-testid': 'password-confirm-input-field' }}
                />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mb: 2 }} data-testid="register-button">
                  登録
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <MuiLink component={Link} to="/login" variant="body2">
                    既にアカウントをお持ちの方はこちら
                  </MuiLink>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
