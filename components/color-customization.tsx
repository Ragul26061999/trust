'use client';

import { useState } from 'react';
import { useTheme } from '../lib/theme-context';
import { Box, Typography, TextField, Button, Paper, IconButton } from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import CloseIcon from '@mui/icons-material/Close';

const ColorCustomization = () => {
  const { theme, updateTheme } = useTheme();
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [colorValue, setColorValue] = useState('');

  const colorOptions = [
    { key: 'primaryColor', label: 'Primary Color', description: 'Main brand color for buttons and highlights' },
    { key: 'secondaryColor', label: 'Secondary Color', description: 'Supporting color for accents' },
    { key: 'backgroundColor', label: 'Background Color', description: 'Main background color' },
    { key: 'textColor', label: 'Text Color', description: 'Primary text color' },
    { key: 'accentColor', label: 'Accent Color', description: 'Special highlight color' },
  ];

  const handleColorChange = (color: string) => {
    setColorValue(color);
    if (showPicker) {
      updateTheme({ [showPicker]: color });
    }
  };

  const openColorPicker = (colorKey: string) => {
    setShowPicker(colorKey);
    setColorValue(theme[colorKey] || '#6750A4');
  };

  const closeColorPicker = () => {
    setShowPicker(null);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Color Customization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Customize the colors of your dashboard interface
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {colorOptions.map((option) => (
          <Box key={option.key} sx={{ minWidth: '300px', flex: '1 1 300px', mb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {option.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme[option.key] || '#ccc',
                    border: '2px solid #ccc',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => openColorPicker(option.key)}
                />
                <TextField
                  value={theme[option.key] || ''}
                  size="small"
                  fullWidth
                  onChange={(e) => updateTheme({ [option.key]: e.target.value })}
                  inputProps={{ style: { fontSize: '0.875rem' } }}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Color Picker Modal */}
      {showPicker && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              bgcolor: 'white',
              p: 2,
              borderRadius: 2,
              boxShadow: 24,
            }}
          >
            <IconButton
              onClick={closeColorPicker}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <CloseIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              {colorOptions.find(opt => opt.key === showPicker)?.label}
            </Typography>
            
            <HexColorPicker
              color={colorValue}
              onChange={handleColorChange}
              style={{ width: '100%', maxWidth: 300 }}
            />
            
            <TextField
              value={colorValue}
              onChange={(e) => handleColorChange(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 2 }}
            />
            
            <Button
              variant="contained"
              onClick={() => {
                updateTheme({ [showPicker]: colorValue });
                closeColorPicker();
              }}
              sx={{ mt: 2 }}
            >
              Apply Color
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ColorCustomization;