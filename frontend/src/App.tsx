import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

// ページコンポーネント
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermsPage from './pages/TermsPage';
import EditorPage from './pages/EditorPage';
import MaintenancePage from './pages/MaintenancePage';
import AdminUsagePage from './pages/admin/UsagePage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import AdminPricingPage from './pages/admin/PricingPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import AdminVersionPage from './pages/admin/VersionPage';
import AdminSalesPage from './pages/admin/SalesPage';

// レイアウトコンポーネント
import AdminLayout from './components/Layout/AdminLayout';
import { ScrollToTop } from './components/Common';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 認証ページ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* ユーザー向けページ */}
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/maintenance" element={<MaintenancePage />} />

            {/* 管理者向けページ */}
            <Route
              path="/admin/usage"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminUsagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admin-management"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminManagementPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminUsersPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminSalesPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminPricingPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/version"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminVersionPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* デフォルトリダイレクト */}
            <Route path="/admin" element={<Navigate to="/admin/usage" replace />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
