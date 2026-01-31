import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

const MaintenancePage = () => {
  const handleReload = () => {
    window.location.reload();
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
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <BuildIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />

          <Typography variant="h5" component="h1" gutterBottom>
            メンテナンス中
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            ただいまシステムメンテナンスを実施中です。
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            終了予定時刻：未定
            <br />
            ご不便をおかけして申し訳ございません。
          </Typography>

          <Button variant="outlined" onClick={handleReload}>
            再読み込み
          </Button>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        © 2026 Visual Studio Markdown Editor
      </Typography>
    </Box>
  );
};

export default MaintenancePage;
