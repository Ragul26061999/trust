'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText as FileIcon,
  Eye as EyeIcon,
  Download as DownloadIcon,
  Palette as PaletteIcon
} from 'lucide-react';
import LucideIcon from './icon-wrapper';
import { NoteAttachment } from '../lib/notes-db';

interface NoteMediaDisplayProps {
  attachments?: NoteAttachment[];
  drawingData?: string;
  drawingThumbnail?: string;
  audioRecordingUrl?: string;
  isDrawing?: boolean;
  isRecording?: boolean;
  compact?: boolean;
}

const NoteMediaDisplay: React.FC<NoteMediaDisplayProps> = ({
  attachments = [],
  drawingData,
  drawingThumbnail,
  audioRecordingUrl,
  isDrawing,
  isRecording,
  compact = false
}) => {
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video' | 'audio' | 'document' | 'drawing';
    url: string;
    title: string;
  } | null>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'audio':
        return <MusicIcon />;
      default:
        return <FileIcon />;
    }
  };

  const handlePreview = (type: 'image' | 'video' | 'audio' | 'document' | 'drawing', url: string, title: string) => {
    setPreviewMedia({ type, url, title });
  };

  const renderPreviewContent = () => {
    if (!previewMedia) return null;

    switch (previewMedia.type) {
      case 'image':
      case 'drawing':
        return (
          <img 
            src={previewMedia.url} 
            alt={previewMedia.title}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        );
      case 'video':
        return (
          <video 
            controls 
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          >
            <source src={previewMedia.url} />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <audio controls style={{ width: '100%' }}>
            <source src={previewMedia.url} />
            Your browser does not support the audio tag.
          </audio>
        );
      case 'document':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FileIcon size={48} color="text.secondary" />
            <Typography variant="body1" sx={{ mt: 2 }}>
              {previewMedia.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Document preview not available. Click Download to view.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const hasMedia = attachments.length > 0 || drawingData || audioRecordingUrl;

  if (!hasMedia) return null;

  return (
    <>
      {/* Media Preview Dialog */}
      <Dialog 
        open={!!previewMedia} 
        onClose={() => setPreviewMedia(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {previewMedia?.title}
            </Typography>
            <Button onClick={() => setPreviewMedia(null)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderPreviewContent()}
        </DialogContent>
        <DialogActions>
          {previewMedia && (
            <Button 
              startIcon={<DownloadIcon />}
              href={previewMedia.url}
              download={previewMedia.title}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Media Display */}
      <Box sx={{ mt: 1 }}>
        {/* Drawing Thumbnail */}
        {drawingThumbnail && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LucideIcon icon={PaletteIcon} size={12} />
              <Typography variant="caption" color="text.secondary">
                Drawing
              </Typography>
            </Box>
            <Card 
              sx={{ 
                maxWidth: compact ? 100 : 150, 
                display: 'inline-block', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => handlePreview('drawing', drawingData || drawingThumbnail, 'Drawing')}
            >
              <CardMedia
                component="img"
                image={drawingThumbnail}
                alt="Drawing thumbnail"
                sx={{ 
                  height: compact ? 60 : 100, 
                  width: compact ? 100 : 150,
                  objectFit: 'cover'
                }}
              />
            </Card>
          </Box>
        )}

        {/* Audio Recording */}
        {audioRecordingUrl && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LucideIcon icon={MusicIcon} size={12} />
              <Typography variant="caption" color="text.secondary">
                Audio Recording
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <audio controls style={{ width: compact ? 150 : 200 }}>
                <source src={audioRecordingUrl} />
              </audio>
              <IconButton 
                size="small"
                onClick={() => handlePreview('audio', audioRecordingUrl, 'Audio Recording')}
              >
                <EyeIcon size={16} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* File Attachments */}
        {attachments.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Attachments ({attachments.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {attachments.slice(0, compact ? 2 : 5).map((attachment) => (
                <Chip
                  key={attachment.id}
                  icon={getFileIcon(attachment.file_type)}
                  label={attachment.file_name.length > 15 
                    ? attachment.file_name.substring(0, 15) + '...' 
                    : attachment.file_name}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => {
                    const previewUrl = attachment.file_url || attachment.file_data;
                    if (previewUrl) {
                      handlePreview(
                        attachment.file_type as 'image' | 'video' | 'audio' | 'document' | 'drawing', 
                        previewUrl, 
                        attachment.file_name
                      );
                    }
                  }}
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {!compact && attachments.length > 5 && (
                <Chip
                  label={`+${attachments.length - 5} more`}
                  size="small"
                  variant="outlined"
                  disabled
                />
              )}
            </Box>
          </Box>
        )}

        {/* Media Type Indicators */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
          {isDrawing && (
            <Chip 
              icon={<LucideIcon icon={PaletteIcon} size={12} />}
              label="Drawing" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
          {isRecording && (
            <Chip 
              icon={<LucideIcon icon={MusicIcon} size={12} />}
              label="Audio" 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          )}
          {attachments.length > 0 && (
            <Chip 
              icon={<LucideIcon icon={FileIcon} size={12} />}
              label={`${attachments.length} file${attachments.length > 1 ? 's' : ''}`} 
              size="small" 
              color="info" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default NoteMediaDisplay;
