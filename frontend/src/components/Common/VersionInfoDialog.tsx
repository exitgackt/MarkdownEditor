import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface VersionInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

const VersionInfoDialog = ({ open, onClose }: VersionInfoDialogProps) => {
  const appName = 'Markdown Editor';
  const version = '1.0.0';
  const copyright = '© 2026 Markdown Editor Team';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 400,
          bgcolor: '#f0f0f0',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#e0e0e0',
          py: 0.5,
          px: 1.5,
          mb: 2,
          fontSize: '12px',
          fontWeight: 'normal',
          borderBottom: '1px solid #ccc',
          color: '#000',
        }}
      >
        バージョン情報
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 2, px: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* アプリアイコン */}
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#0078d4',
              borderRadius: '8px',
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Box>

          {/* アプリ名とバージョン */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#000',
                fontWeight: 'bold',
                fontSize: '18px',
                mb: 0.5,
              }}
            >
              {appName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#444', fontSize: '13px' }}
            >
              バージョン {version}
            </Typography>
          </Box>

          {/* 説明文 */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: '#444', fontSize: '12px', lineHeight: 1.6 }}
            >
              Visual Studio風マークダウンエディタ
              <br />
              リアルタイムプレビュー、マインドマップ表示、
              <br />
              差分比較機能を搭載
            </Typography>
          </Box>

          {/* コピーライト */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: '#666', fontSize: '11px' }}
            >
              {copyright}
            </Typography>
          </Box>

          {/* リンク */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              underline="hover"
              sx={{ color: '#0078d4', fontSize: '11px', cursor: 'pointer' }}
              onClick={(e) => e.preventDefault()}
            >
              ライセンス情報
            </Link>
            <Link
              href="#"
              underline="hover"
              sx={{ color: '#0078d4', fontSize: '11px', cursor: 'pointer' }}
              onClick={(e) => e.preventDefault()}
            >
              プライバシーポリシー
            </Link>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 2,
          justifyContent: 'center',
          bgcolor: '#e0e0e0',
          borderTop: '1px solid #ccc',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={{
            minWidth: 85,
            height: 26,
            fontSize: '12px',
            color: '#000',
            borderColor: '#adadad',
            bgcolor: '#f0f0f0',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#c7e0f4',
              borderColor: '#0078d4',
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionInfoDialog;
