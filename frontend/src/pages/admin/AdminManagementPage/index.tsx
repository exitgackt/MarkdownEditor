import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAdminStore } from '../../../stores';
import { AdminUserDialog, MessageDialog } from '../../../components/Common';

const AdminManagementPage = () => {
  const {
    adminUsers,
    addAdminUser,
    removeAdminUser,
    fetchAdminUsers,
  } = useAdminStore();

  const [adminUserDialogOpen, setAdminUserDialogOpen] = useState(false);

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

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const showMessage = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    setMessageDialog({ open: true, type, title, message });
  };

  const handleAdminUserAdd = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const result = await addAdminUser(email);
    if (result.success) {
      showMessage('success', '追加完了', `${email}\nを管理者として追加しました`);
    }
    return result;
  };

  const handleAdminUserRemove = async (id: string, email: string) => {
    const success = await removeAdminUser(id);
    if (success) {
      showMessage('success', '削除完了', `${email}\nを管理者から削除しました`);
    } else {
      showMessage('error', '削除失敗', '自分自身のアカウントは削除できません');
    }
  };

  const formatDate = (dateString: string) => {
    // UTC文字列をDateオブジェクトに変換（Zを追加してUTCであることを明示）
    const dateStr = dateString.includes('Z') ? dateString : dateString.replace(/\+00:00$/, 'Z');
    const date = new Date(dateStr);

    // 日本時間（JST, UTC+9）で表示
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* 管理者管理 */}
      <Card sx={{ boxShadow: 1, overflow: 'hidden' }}>
        <CardContent sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            既に登録されているユーザーのメールアドレスを指定して、管理者権限を付与できます。存在しないメールアドレスは追加できません。まず通常のユーザーとして登録してから、管理者権限を付与してください。
          </Alert>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAdminUserDialogOpen(true)}
            >
              管理者を追加
            </Button>
          </Box>

          <List>
            {adminUsers.map((admin) => (
              <ListItem
                key={admin.id}
                sx={{
                  bgcolor: admin.isSelf ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {admin.email}
                      {admin.isSelf && (
                        <Chip label="自分" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={`追加日: ${formatDate(admin.added_at)}`}
                />
                {!admin.isSelf && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleAdminUserRemove(admin.id, admin.email)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* ダイアログ群 */}
      <AdminUserDialog
        open={adminUserDialogOpen}
        onClose={() => setAdminUserDialogOpen(false)}
        onAdd={handleAdminUserAdd}
      />

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

export default AdminManagementPage;
