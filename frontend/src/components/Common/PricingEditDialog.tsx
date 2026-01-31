import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { PricingPlan } from '../../types';

interface PricingEditDialogProps {
  open: boolean;
  plan: PricingPlan | null;
  onClose: () => void;
  onSave: (id: string, price: number, features: string[]) => void;
}

const PricingEditDialog = ({
  open,
  plan,
  onClose,
  onSave,
}: PricingEditDialogProps) => {
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [priceError, setPriceError] = useState('');

  // プランが変更されたら初期化
  useEffect(() => {
    if (plan) {
      setPrice(plan.price.toString());
      setFeatures([...plan.features]);
      setPriceError('');
    }
  }, [plan]);

  const handlePriceChange = (value: string) => {
    setPrice(value);

    // バリデーション
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue <= 0)) {
      setPriceError('正の数値を入力してください');
    } else {
      setPriceError('');
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!plan || priceError || !price) return;

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return;

    onSave(plan.id, numPrice, features);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{plan.name} の編集</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* 価格入力 */}
          <TextField
            fullWidth
            label="価格"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            error={!!priceError}
            helperText={priceError || `${plan.currency} / ${plan.interval === 'month' ? '月' : '年'}`}
            type="number"
            inputProps={{ min: 0, step: 1 }}
            sx={{ mb: 3 }}
          />

          {/* 割引率表示（年額プランのみ） */}
          {plan.interval === 'year' && price && !priceError && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.contrastText">
                月額プラン（980円）の12ヶ月分: {980 * 12}円
              </Typography>
              <Typography variant="body2" color="info.contrastText">
                割引額: {980 * 12 - parseFloat(price)}円
              </Typography>
              <Typography variant="body2" color="info.contrastText">
                割引率: {(((980 * 12 - parseFloat(price)) / (980 * 12)) * 100).toFixed(1)}%
              </Typography>
            </Box>
          )}

          {/* 機能リスト */}
          <Typography variant="subtitle2" gutterBottom>
            機能リスト
          </Typography>
          <List dense>
            {features.map((feature, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteFeature(index)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>

          {/* 機能追加 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="新しい機能"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleAddFeature}
              disabled={!newFeature.trim()}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>キャンセル</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!!priceError || !price}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PricingEditDialog;
