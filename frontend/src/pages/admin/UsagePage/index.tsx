import { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAdminStore } from '../../../stores';

const AdminUsagePage = () => {
  const {
    usageSummary,
    usageStats,
    fetchUsageSummary,
    fetchUsageStats,
  } = useAdminStore();

  // 初回データ取得
  useEffect(() => {
    fetchUsageSummary();
    fetchUsageStats();
  }, [fetchUsageSummary, fetchUsageStats]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* サマリーカード */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {usageSummary?.total_users || 0}
            </Typography>
            <Typography color="text.secondary">総ユーザー数</Typography>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {usageSummary?.active_users_today || 0}
            </Typography>
            <Typography color="text.secondary">アクティブユーザー</Typography>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {usageSummary?.total_logins_today || 0}
            </Typography>
            <Typography color="text.secondary">本日のログイン</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 利用統計グラフ */}
      <Card sx={{ mb: 4, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            利用統計（過去30日間）
          </Typography>

          {/* アクティブユーザー推移（折れ線グラフ） */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              アクティブユーザー推移
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={usageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value as string);
                    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#2e7d32"
                  name="アクティブユーザー"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* 新規ユーザー推移（棒グラフ） */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              新規ユーザー登録推移
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value as string);
                    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="newUsers"
                  fill="#0288d1"
                  name="新規ユーザー"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminUsagePage;
