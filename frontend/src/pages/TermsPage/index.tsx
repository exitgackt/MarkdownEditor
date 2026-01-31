import { Box, Card, CardContent, Typography, Button, Checkbox, FormControlLabel, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';

const TermsPage = () => {
  const navigate = useNavigate();
  const { acceptTerms, isLoading, error, clearError } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;

    clearError();
    const success = await acceptTerms();

    if (success) {
      navigate('/editor');
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
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            サービス利用規約
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              maxHeight: 400,
              overflow: 'auto',
              bgcolor: 'background.default',
              p: 2,
              borderRadius: 1,
              my: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#fff' }}>
              {/* 利用規約の内容（後でAPIから取得） */}
              利用規約の内容がここに表示されます。
              <br /><br />
              第1条（目的）
              <br />
              本規約は、本サービスの利用条件を定めるものです。
              <br /><br />
              第2条（定義）
              <br />
              「本サービス」とは、当社が提供するマークダウンエディタサービスを指します。
              <br /><br />
              ...
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
            }
            label="利用規約に同意する"
          />

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              fullWidth
              disabled={!agreed || isLoading}
              onClick={handleAccept}
              sx={{
                py: 1.5,
                color: '#fff !important',
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.5) !important'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '同意してサービスを開始'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TermsPage;
