import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, error } = useAuthStore();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      return;
    }

    const verify = async () => {
      const success = await verifyEmail(token);
      if (success) {
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
      }
    };

    verify();
  }, [searchParams, verifyEmail, navigate]);

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
              メールアドレスの確認
            </Typography>
          </Box>

          {verificationStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                確認中...
              </Typography>
            </Box>
          )}

          {verificationStatus === 'success' && (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                メールアドレスが確認されました！
                <br />
                ログインページに移動します...
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
              >
                ログインページへ
              </Button>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || 'メールアドレスの確認に失敗しました'}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
              >
                ログインページへ
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmailPage;
