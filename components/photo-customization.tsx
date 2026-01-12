'use client';

import { useState, useRef } from 'react';
import { useTheme } from '../lib/theme-context';
import { Box, Typography, Button, Paper, IconButton, Avatar } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';

const PhotoCustomization = () => {
  const { theme, updateTheme } = useTheme();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        updateTheme({ backgroundImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setPreviewUrl(null);
    updateTheme({ backgroundImage: null });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Photo Customization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add a personal touch to your dashboard with custom photos
      </Typography>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={triggerFileSelect}
            sx={{ textTransform: 'none' }}
          >
            Upload Photo
          </Button>
          
          {previewUrl && (
            <IconButton onClick={removePhoto} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {previewUrl && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">Preview:</Typography>
            <Avatar
              src={previewUrl}
              alt="Custom background preview"
              sx={{ width: 80, height: 80, border: '2px solid #ccc' }}
            />
          </Box>
        )}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Supported formats: JPG, PNG, WEBP. Recommended size: 1920x1080 pixels for best results.
      </Typography>
    </Paper>
  );
};

export default PhotoCustomization;