'use client';

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Upload as UploadIcon,
  X as CloseIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText as FileIcon,
  Eye as EyeIcon,
  Download as DownloadIcon
} from 'lucide-react';
import LucideIcon from './icon-wrapper';
import { NoteAttachment } from '../lib/notes-db';

interface FileUploadProps {
  onFilesChange: (files: NoteAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesChange, 
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc,.docx,.txt']
}) => {
  const [files, setFiles] = useState<NoteAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<NoteAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError(null);

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newFiles: NoteAttachment[] = [];

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} exceeds maximum size of ${maxSize}MB`);
        continue;
      }

      try {
        const base64Data = await readFileAsBase64(file);
        const attachment: NoteAttachment = {
          id: `temp-${Date.now()}-${Math.random()}`,
          note_id: '', // Will be set when saving note
          file_name: file.name,
          file_type: getFileType(file),
          file_size: file.size,
          file_data: base64Data,
          mime_type: file.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        newFiles.push(attachment);
      } catch (err) {
        setError(`Failed to process file ${file.name}`);
      }
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    setUploading(false);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handlePreview = (file: NoteAttachment) => {
    setPreviewFile(file);
  };

  const renderPreviewContent = (file: NoteAttachment) => {
    if (!file.file_data) return null;

    if (file.file_type === 'image') {
      return (
        <img 
          src={file.file_data} 
          alt={file.file_name}
          style={{ maxWidth: '100%', maxHeight: '400px' }}
        />
      );
    }

    if (file.file_type === 'video') {
      return (
        <video 
          controls 
          style={{ maxWidth: '100%', maxHeight: '400px' }}
        >
          <source src={file.file_data} type={file.mime_type} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (file.file_type === 'audio') {
      return (
        <audio controls style={{ width: '100%' }}>
          <source src={file.file_data} type={file.mime_type} />
          Your browser does not support the audio tag.
        </audio>
      );
    }

    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          Preview not available for this file type
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          href={file.file_data}
          download={file.file_name}
          sx={{ mt: 2 }}
        >
          Download {file.file_name}
        </Button>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Attachments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Button */}
      <Box sx={{ mb: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
          fullWidth
        >
          {uploading ? 'Processing...' : `Upload Files (${files.length}/${maxFiles})`}
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Max file size: {maxSize}MB • Supported: Images, Videos, Audio, Documents
        </Typography>
      </Box>

      {uploading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Files List */}
      {files.length > 0 && (
        <List dense>
          {files.map((file) => (
            <ListItem key={file.id} sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getFileIcon(file.file_type)}
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {file.file_name}
                    </Typography>
                    <Chip 
                      label={file.file_type} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                }
                secondary={
                  file.file_size && (
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.file_size)}
                    </Typography>
                  )
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handlePreview(file)}
                  sx={{ mr: 1 }}
                >
                  <EyeIcon size={16} />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <CloseIcon size={16} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={!!previewFile} 
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {previewFile?.file_name}
            </Typography>
            <IconButton onClick={() => setPreviewFile(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewFile && renderPreviewContent(previewFile)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewFile(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FileUpload;
