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
          fontSize: '12px',
          fontWeight: 'normal',
          borderBottom: '1px solid #ccc',
          color: '#000',
        }}
      >
        バージョン情報
      </DialogTitle>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: '#ccc', bgcolor: '#f0f0f0' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="version info tabs"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              fontSize: '12px',
              color: '#000',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#0078d4',
                fontWeight: 'bold',
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
        sx={{ pt: 0, pb: 2, px: 0, minHeight: 300, maxHeight: '60vh', overflow: 'auto' }}
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
                  color: '#000',
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
                  color: '#000',
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
                sx={{ color: '#666', fontSize: '11px' }}
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
              color: '#000',
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
              color: '#000',
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
