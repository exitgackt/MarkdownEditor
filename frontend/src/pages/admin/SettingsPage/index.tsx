import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  TextField,
  Checkbox,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAdminStore } from '../../../stores';
import type { AuthMethodSettings } from '../../../types';
import {
  TextEditDialog,
  MaintenanceConfirmDialog,
  MessageDialog,
  AuthSettingsDialog,
} from '../../../components/Common';

const AdminSettingsPage = () => {
  const {
    browserGuide,
    terms,
    maintenanceMode,
    authSettings,
    updateBrowserGuide,
    updateTerms,
    toggleMaintenanceMode,
    fetchAuthSettings,
    updateAuthSettings,
  } = useAdminStore();

  useEffect(() => {
    fetchAuthSettings();
  }, [fetchAuthSettings]);

  // ダイアログ状態
  const [authSettingsDialogOpen, setAuthSettingsDialogOpen] = useState(false);
  const [browserGuideDialogOpen, setBrowserGuideDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  // メッセージダイアログ
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showMessage = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    setMessageDialog({ open: true, type, title, message });
  };

  const handleBrowserGuideSave = (content: string) => {
    updateBrowserGuide(content);
    showMessage('success', '保存完了', '対応ブラウザ案内を更新しました');
  };

  const handleTermsSave = (content: string) => {
    updateTerms(content);
    showMessage('success', '保存完了', '利用規約を更新しました');
  };

  const handleMaintenanceConfirm = (isActive: boolean, message?: string) => {
    toggleMaintenanceMode(isActive, message);
    showMessage(
      'success',
      '設定変更完了',
      `メンテナンスモードを${isActive ? 'ON' : 'OFF'}にしました`
    );
  };

  const handleAuthSettingsSave = async (settings: AuthMethodSettings): Promise<boolean> => {
    const success = await updateAuthSettings(settings);
    if (success) {
      showMessage('success', '保存完了', '認証方式を更新しました');
    } else {
      showMessage('error', '保存失敗', '認証方式の更新に失敗しました');
    }
    return success;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* 認証方式設定 */}
      <Card sx={{ mb: 3, boxShadow: 1, overflow: 'hidden' }}>
        <CardContent sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">認証方式</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setAuthSettingsDialogOpen(true)}
              disabled={!authSettings}
            >
              編集
            </Button>
          </Box>

          {authSettings && (
            <>
              <FormControl component="fieldset" sx={{ mt: 2, mb: 3, width: '100%' }}>
                <FormLabel component="legend" sx={{ color: 'text.primary' }}>
                  有効な認証方式
                </FormLabel>
                <RadioGroup value={authSettings.mode} sx={{ pointerEvents: 'none' }}>
                  <FormControlLabel
                    value="email"
                    control={<Radio />}
                    label="メール・パスワードのみ (推奨: 初期設定)"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: authSettings.mode === 'email' ? 'text.primary' : 'text.disabled'
                      }
                    }}
                  />
                  <FormControlLabel
                    value="google"
                    control={<Radio />}
                    label="Google認証のみ"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: authSettings.mode === 'google' ? 'text.primary' : 'text.disabled'
                      }
                    }}
                  />
                  <FormControlLabel
                    value="both"
                    control={<Radio />}
                    label="両方"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: authSettings.mode === 'both' ? 'text.primary' : 'text.disabled'
                      }
                    }}
                  />
                </RadioGroup>
              </FormControl>

              <Alert severity="info" sx={{ mb: 3 }}>
                現在の設定:{' '}
                {authSettings.mode === 'email'
                  ? 'メール・パスワードのみ'
                  : authSettings.mode === 'google'
                  ? 'Google認証のみ'
                  : '両方'}
              </Alert>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'normal' }}>
                パスワードポリシー
              </Typography>

              <TextField
                fullWidth
                label="最小文字数"
                type="number"
                value={authSettings.password_min_length}
                InputProps={{ readOnly: true }}
                inputProps={{ tabIndex: -1 }}
                sx={{
                  mb: 2,
                  pointerEvents: 'none',
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pointerEvents: 'none' }}>
                <FormControlLabel
                  control={<Checkbox checked={authSettings.password_require_uppercase} />}
                  label="大文字必須"
                />
                <FormControlLabel
                  control={<Checkbox checked={authSettings.password_require_lowercase} />}
                  label="小文字必須"
                />
                <FormControlLabel
                  control={<Checkbox checked={authSettings.password_require_number} />}
                  label="数字必須"
                />
                <FormControlLabel
                  control={<Checkbox checked={authSettings.password_require_special} />}
                  label="特殊文字必須"
                />
                <FormControlLabel
                  control={<Checkbox checked={authSettings.email_verification_required} />}
                  label="メール検証必須"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* 対応ブラウザ案内 */}
      <Card sx={{ mb: 3, boxShadow: 1, overflow: 'hidden' }}>
        <CardContent sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">対応ブラウザ案内</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setBrowserGuideDialogOpen(true)}
            >
              編集
            </Button>
          </Box>
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#000',
              maxHeight: '210px',
              overflow: 'auto',
            }}
          >
            {browserGuide}
          </Box>
        </CardContent>
      </Card>

      {/* 利用規約 */}
      <Card sx={{ mb: 3, boxShadow: 1, overflow: 'hidden' }}>
        <CardContent sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">利用規約</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setTermsDialogOpen(true)}
            >
              編集
            </Button>
          </Box>
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
              maxHeight: '210px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#000',
            }}
          >
            {terms}
          </Box>
        </CardContent>
      </Card>

      {/* メンテナンスモード */}
      <Card sx={{ mb: 3, boxShadow: 1, overflow: 'hidden' }}>
        <CardContent sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Typography variant="h6" gutterBottom>
            メンテナンスモード
          </Typography>

          {maintenanceMode.isActive && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              現在メンテナンスモードがONになっています。管理者以外のユーザーはアクセスできません。
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: maintenanceMode.isActive ? 0 : 2 }}>
            <Typography>現在の状態:</Typography>
            <Chip
              label={maintenanceMode.isActive ? 'ON' : 'OFF'}
              color={maintenanceMode.isActive ? 'error' : 'success'}
              size="small"
            />
          </Box>

          {maintenanceMode.isActive && maintenanceMode.message && (
            <Box
              sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ color: '#000' }}>
                メンテナンスメッセージ:
              </Typography>
              <Typography variant="body2" sx={{ color: '#000', fontSize: '14px', lineHeight: 1.5 }} data-testid="maintenance-message">{maintenanceMode.message}</Typography>
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={maintenanceMode.isActive}
                onChange={() => setMaintenanceDialogOpen(true)}
                color={maintenanceMode.isActive ? 'error' : 'primary'}
              />
            }
            label={
              maintenanceMode.isActive
                ? 'メンテナンスモードをOFFにする'
                : 'メンテナンスモードをONにする'
            }
          />
        </CardContent>
      </Card>

      {/* ダイアログ群 */}
      <TextEditDialog
        open={browserGuideDialogOpen}
        title="対応ブラウザ案内の編集"
        initialValue={browserGuide}
        onClose={() => setBrowserGuideDialogOpen(false)}
        onSave={handleBrowserGuideSave}
        maxLength={2000}
      />

      <TextEditDialog
        open={termsDialogOpen}
        title="利用規約の編集"
        initialValue={terms}
        onClose={() => setTermsDialogOpen(false)}
        onSave={handleTermsSave}
        maxLength={50000}
      />

      <MaintenanceConfirmDialog
        open={maintenanceDialogOpen}
        currentState={maintenanceMode.isActive}
        onClose={() => setMaintenanceDialogOpen(false)}
        onConfirm={handleMaintenanceConfirm}
      />

      {authSettings && (
        <AuthSettingsDialog
          open={authSettingsDialogOpen}
          initialSettings={authSettings}
          onClose={() => setAuthSettingsDialogOpen(false)}
          onSave={handleAuthSettingsSave}
        />
      )}

      <MessageDialog
        open={messageDialog.open}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={() => setMessageDialog({ ...messageDialog, open: false })}
      />
    </Box>
  );
};

export default AdminSettingsPage;
