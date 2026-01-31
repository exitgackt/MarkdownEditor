import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type MessageDialogType = 'info' | 'warning' | 'error' | 'question' | 'success';

interface MessageDialogProps {
  open: boolean;
  title?: string;
  message: string;
  type?: MessageDialogType;
  onClose: () => void;
}

const MessageDialog = ({
  open,
  title = 'Markdown Editor',
  message,
  type = 'info',
  onClose
}: MessageDialogProps) => {
  const getIcon = () => {
    const iconSx = { fontSize: 32 };
    switch (type) {
      case 'warning':
        return <WarningAmberIcon sx={{ ...iconSx, color: '#ed6c02' }} />;
      case 'error':
        return <ErrorOutlineIcon sx={{ ...iconSx, color: '#d32f2f' }} />;
      case 'question':
        return <HelpOutlineIcon sx={{ ...iconSx, color: '#0078d4' }} />;
      case 'success':
        return <InfoOutlinedIcon sx={{ ...iconSx, color: '#2e7d32' }} />;
      default:
        return <InfoOutlinedIcon sx={{ ...iconSx, color: '#0078d4' }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      disableScrollLock={true}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 370,
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
          mb: 3,
          fontSize: '12px',
          fontWeight: 'normal',
          borderBottom: '1px solid #ccc',
          color: '#000',
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 3, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {getIcon()}
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#000', fontSize: '12px', whiteSpace: 'pre-line' }}>
              {message}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, pt: 2, justifyContent: 'center', bgcolor: '#e0e0e0', borderTop: '1px solid #ccc' }}>
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

export default MessageDialog;
