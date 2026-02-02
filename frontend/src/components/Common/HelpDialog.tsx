import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useState, useEffect } from 'react';
import {
  Description,
  TouchApp,
  Extension,
} from '@mui/icons-material';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

const HelpDialog = ({ open, onClose }: HelpDialogProps) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // ダイアログを開いたときにタブを最初に戻す
  useEffect(() => {
    if (open) {
      setTabValue(0);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 700,
          height: 550,
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
        ヘルプ
      </DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: '#3C3C3C' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#888',
              fontSize: '12px',
              textTransform: 'none',
              minHeight: 40,
              '&.Mui-selected': {
                color: '#0078d4',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0078d4',
            },
          }}
        >
          <Tab icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" label="概要" />
          <Tab icon={<TouchApp sx={{ fontSize: 18 }} />} iconPosition="start" label="基本操作" />
          <Tab icon={<Extension sx={{ fontSize: 18 }} />} iconPosition="start" label="機能" />
        </Tabs>
      </Box>
      <DialogContent sx={{ pt: 0, pb: 2, px: 3, overflow: 'auto' }}>
        {/* 概要タブ */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontSize: '16px' }}>
            Markdown Editor へようこそ
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6 }}>
            モダンなIDE風のインターフェースを持つ、高機能なマークダウンエディタです。
            リアルタイムプレビュー、マインドマップ表示、差分比較など、様々な機能を備えています。
          </Typography>
          <Divider sx={{ borderColor: '#3C3C3C', my: 2 }} />
          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1.5, fontWeight: 600 }}>
            主な特徴
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="Monaco Editor"
                secondary="シンタックスハイライトやコード補完機能を備えた高機能エディタエンジン"
                primaryTypographyProps={{ sx: { color: '#fff', fontSize: '13px' } }}
                secondaryTypographyProps={{ sx: { color: '#888', fontSize: '12px' } }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="リアルタイムプレビュー"
                secondary="マークダウンをリアルタイムでプレビュー表示"
                primaryTypographyProps={{ sx: { color: '#fff', fontSize: '13px' } }}
                secondaryTypographyProps={{ sx: { color: '#888', fontSize: '12px' } }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="マインドマップ表示"
                secondary="見出し構造を視覚的なマインドマップで表示"
                primaryTypographyProps={{ sx: { color: '#fff', fontSize: '13px' } }}
                secondaryTypographyProps={{ sx: { color: '#888', fontSize: '12px' } }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="差分比較"
                secondary="2つのファイルを並べて差分を確認"
                primaryTypographyProps={{ sx: { color: '#fff', fontSize: '13px' } }}
                secondaryTypographyProps={{ sx: { color: '#888', fontSize: '12px' } }}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* 基本操作タブ */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontSize: '16px' }}>
            基本操作
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            1. フォルダを開く
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「ファイル」→「フォルダを開く」またはAlt+U、または左サイドバーのエクスプローラーにある
            「フォルダーを開く」ボタンで、編集したいフォルダを選択します。
            左サイドバーにファイルツリーが表示されます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            2. ファイルを開く / インポート
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1, lineHeight: 1.6, fontSize: '12px' }}>
            <strong style={{ color: '#fff' }}>ファイルを開く（Alt+O）:</strong> 既存のマークダウンやテキストファイルをそのまま開きます。
            対応形式: .md, .txt, .json, .js, .ts, .tsx, .jsx, .css, .html, .xml, .yaml, .yml
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            <strong style={{ color: '#fff' }}>インポート（Alt+I）:</strong> Word文書（.docx）をMarkdown形式に変換して開きます。
            Word文書を編集したい場合はインポート機能を使用してください。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            3. ファイルを編集
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            ファイルツリーからファイルをクリックすると、エディタで開きます。
            複数のファイルをタブで同時に開くことができます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            4. プレビュー表示
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「表示」→「プレビュー」またはAlt+Lで、マークダウンのプレビューを表示できます。
            エディタとプレビューは同期スクロールします。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            5. お気に入り登録
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            よく使うファイルは、ファイルツリーの星アイコンをクリックしてお気に入りに登録できます。
            左サイドバーの「お気に入り」セクションから素早くアクセスできます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            6. 保存
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            Ctrl+Sで現在のファイルを保存できます。
            未保存の変更があるタブには、タブ名の横に●マークが表示されます。
          </Typography>
        </TabPanel>

        {/* 機能タブ */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontSize: '16px' }}>
            主要機能
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            プレビュー
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「表示」→「プレビュー」またはAlt+Lで、マークダウンのリアルタイムプレビューを表示できます。
            エディタとプレビューは同期スクロールし、編集内容が即座に反映されます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            マインドマップ
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「表示」→「マインドマップ」またはAlt+Mでマークダウンの見出し構造をマインドマップとして視覚化できます。
            ドキュメント構造の把握に便利です。マインドマップはSVGまたはPNG形式でエクスポートできます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            分割エディタ
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「表示」→「分割エディタ」またはAlt+Gで画面を左右に分割し、2つのファイルを同時に編集できます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            差分比較
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            「ツール」→「差分比較」またはAlt+Yで2つのファイルの差分を視覚的に比較できます。
            変更箇所が色分けされて表示され、差分をマージすることも可能です。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            エクスポート
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1, lineHeight: 1.6, fontSize: '12px' }}>
            <strong style={{ color: '#fff' }}>ドキュメント:</strong> 「ファイル」→「ドキュメントをエクスポート」から、
            マークダウンをPDF、HTML、Word形式でエクスポートできます。
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            <strong style={{ color: '#fff' }}>マインドマップ:</strong> 「ファイル」→「マインドマップをエクスポート」から、
            マインドマップをSVGまたはPNG形式でエクスポートできます（マインドマップ表示中のみ）。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            カスタマイズ
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2, lineHeight: 1.6, fontSize: '12px' }}>
            設定（右上のギアアイコン）から、フォントサイズ、折り返し設定などを
            カスタマイズできます。
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#0078d4', mb: 1, fontWeight: 600, fontSize: '13px' }}>
            キーボードショートカット
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', lineHeight: 1.6, fontSize: '12px' }}>
            設定メニューから「キーボードショートカット」を選択すると、
            利用可能なすべてのショートカットを確認できます。
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

export default HelpDialog;
