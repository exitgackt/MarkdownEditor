import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAdminStore } from '../../stores';

interface VersionInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`version-tabpanel-${index}`}
      aria-labelledby={`version-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VersionInfoDialog = ({ open, onClose }: VersionInfoDialogProps) => {
  const { version, license, privacyPolicy } = useAdminStore();
  const [tabValue, setTabValue] = useState(0);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // タブ切り替え時にスクロール位置を最上段にリセット
  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0;
    }
  }, [tabValue]);

  // ダイアログを開いたときもスクロール位置をリセット
  useEffect(() => {
    if (open && dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0;
      setTabValue(0); // タブも最初に戻す
    }
  }, [open]);

  const appName = 'Markdown Editor';
  const copyright = '© 2026 Markdown Editor Team';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 600,
          maxHeight: '80vh',
          bgcolor: '#2D2D2D',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#1E1E1E',
          py: 1.5,
          px: 2,
          fontSize: '14px',
          fontWeight: 500,
          borderBottom: '1px solid #3C3C3C',
          color: '#fff',
        }}
      >
        バージョン情報
      </DialogTitle>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: '#3C3C3C' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="version info tabs"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '12px',
              color: '#888',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#0078d4',
                fontWeight: 500,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0078d4',
            },
          }}
        >
          <Tab label="バージョン" />
          <Tab label="ライセンス" />
          <Tab label="プライバシーポリシー" />
        </Tabs>
      </Box>

      <DialogContent
        ref={dialogContentRef}
        sx={{ pt: 0, pb: 2, px: 3, minHeight: 300, maxHeight: '60vh', overflow: 'auto' }}
      >
        {/* バージョンタブ */}
        <TabPanel value={tabValue} index={0}>
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

            {/* アプリ名 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  mb: 1,
                }}
              >
                {appName}
              </Typography>
            </Box>

            {/* バージョン情報（adminStoreから取得） */}
            <Box sx={{ textAlign: 'left', width: '100%', maxWidth: 500 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#ccc',
                  fontSize: '13px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {version}
              </Typography>
            </Box>

            {/* コピーライト */}
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: '#888', fontSize: '11px' }}
              >
                {copyright}
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* ライセンスタブ */}
        <TabPanel value={tabValue} index={1}>
          <Typography
            variant="body2"
            sx={{
              color: '#ccc',
              fontSize: '13px',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}
          >
            {license}
          </Typography>
        </TabPanel>

        {/* プライバシーポリシータブ */}
        <TabPanel value={tabValue} index={2}>
          <Typography
            variant="body2"
            sx={{
              color: '#ccc',
              fontSize: '13px',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}
          >
            {privacyPolicy}
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 1,
          borderTop: '1px solid #3C3C3C',
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={onClose}
          sx={{
            minWidth: 80,
            height: 30,
            fontSize: '12px',
            bgcolor: '#0078d4',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#106ebe',
            },
          }}
        >
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionInfoDialog;
