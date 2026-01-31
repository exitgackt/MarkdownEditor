import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAdminStore } from '../../../stores';
import type { UserDetail } from '../../../types';

const UsersPage = () => {
  const {
    userDetails,
    userDetailsTotal,
    userDetailsPage,
    fetchUserDetails,
    updateUserStatus,
    isLoading,
    error,
  } = useAdminStore();

  // ユーザー一覧の状態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'monthly' | 'yearly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // メニュー状態
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  // データ取得（フィルタ変更時にも再取得）
  useEffect(() => {
    fetchUserDetails(page + 1, rowsPerPage, {
      status: statusFilter,
      plan: planFilter,
      search: searchQuery,
    });
  }, [fetchUserDetails, page, rowsPerPage, statusFilter, planFilter, searchQuery]);

  // サーバー側でフィルタリング・ページネーション済みのデータを使用

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ユーザーメニュー
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserDetail) => {
    setUserMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleToggleUserStatus = async () => {
    if (selectedUser) {
      const newStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
      await updateUserStatus(selectedUser.id, newStatus);
      // ユーザー一覧を再取得
      await fetchUserDetails(page + 1, rowsPerPage, {
        status: statusFilter,
        plan: planFilter,
        search: searchQuery,
      });
    }
    handleUserMenuClose();
  };

  const handleRefresh = () => {
    fetchUserDetails(page + 1, rowsPerPage, {
      status: statusFilter,
      plan: planFilter,
      search: searchQuery,
    });
  };

  const getStatusChip = (status: 'active' | 'suspended') => {
    return (
      <Chip
        label={status === 'active' ? 'アクティブ' : '停止中'}
        color={status === 'active' ? 'success' : 'default'}
        size="small"
      />
    );
  };

  const getPlanChip = (plan: 'free' | 'monthly' | 'yearly') => {
    const labels: Record<'free' | 'monthly' | 'yearly', string> = {
      free: '無料',
      monthly: '月額',
      yearly: '年額',
    };
    const colors: Record<'free' | 'monthly' | 'yearly', 'default' | 'primary' | 'success'> = {
      free: 'default',
      monthly: 'primary',
      yearly: 'success',
    };
    return <Chip label={labels[plan]} color={colors[plan]} size="small" />;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        簡易版: 全ユーザーが「無料プラン」「アクティブ」で表示されます。招待機能は含まれていません。
      </Alert>

      <Typography variant="h4" sx={{ mb: 3 }}>
        ユーザー管理
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="refresh-button"
        >
          更新
        </Button>
      </Box>

      <Card sx={{ boxShadow: 1 }}>
        <CardContent>
          {/* フィルタ・検索 */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              select
              label="ステータス"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'suspended');
                setPage(0);
              }}
              size="small"
              sx={{ width: { xs: '100%', sm: 150 } }}
              data-testid="status-filter"
              SelectProps={{
                MenuProps: {
                  disableScrollLock: true,
                },
              }}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="suspended">停止中</MenuItem>
            </TextField>

            <TextField
              select
              label="プラン"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value as 'all' | 'free' | 'monthly' | 'yearly');
                setPage(0);
              }}
              size="small"
              sx={{ width: { xs: '100%', sm: 150 } }}
              data-testid="plan-filter"
              SelectProps={{
                MenuProps: {
                  disableScrollLock: true,
                },
              }}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="free">無料</MenuItem>
              <MenuItem value="monthly">月額</MenuItem>
              <MenuItem value="yearly">年額</MenuItem>
            </TextField>

            <TextField
              label="検索"
              placeholder="名前またはメールアドレスで検索"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ flex: 1 }}
              data-testid="search-field"
            />
          </Box>

          {/* テーブル */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>名前</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>プラン</TableCell>
                  <TableCell>登録日</TableCell>
                  <TableCell>最終ログイン</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.map((user: UserDetail) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getStatusChip(user.status)}</TableCell>
                    <TableCell>{getPlanChip(user.plan)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleUserMenuOpen(e, user)}
                        aria-label="メニューを開く"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ページネーション */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={userDetailsTotal}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}件`
            }
          />
        </CardContent>
      </Card>

      {/* ユーザーメニュー */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        disableScrollLock={true}
      >
        <MenuItemComponent onClick={handleToggleUserStatus}>
          {selectedUser?.status === 'active' ? '停止する' : 'アクティブにする'}
        </MenuItemComponent>
      </Menu>
    </Box>
  );
};

export default UsersPage;
