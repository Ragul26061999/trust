'use client';

import { useState } from 'react';
import { useTheme } from '../lib/theme-context';
import { Box, Typography, Button, Paper, Tabs, Tab, IconButton } from '@mui/material';
import ColorCustomization from './color-customization';
import PhotoCustomization from './photo-customization';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customization-tabpanel-${index}`}
      aria-labelledby={`customization-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `customization-tab-${index}`,
    'aria-controls': `customization-tabpanel-${index}`,
  };
}

const CustomizationPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const { saveThemeToDB, theme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveToDB = async () => {
    setSaving(true);
    const success = await saveThemeToDB();
    setSaving(false);
    setSaveSuccess(success);
    
    if (success) {
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Dashboard Customization
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveToDB}
          disabled={saving}
          sx={{ textTransform: 'none' }}
        >
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
        </Button>
      </Box>
      
      <Tabs value={tabValue} onChange={handleChange} aria-label="customization tabs">
        <Tab label="Colors" {...a11yProps(0)} />
        <Tab label="Photos" {...a11yProps(1)} />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <ColorCustomization />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <PhotoCustomization />
      </TabPanel>
      
      {saveSuccess && (
        <Paper 
          sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: 'success.light',
            borderLeft: '4px solid',
            borderColor: 'success.main',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
            Your customization settings have been saved successfully!
          </Typography>
        </Paper>
      )}
    </Paper>
  );
};

export default CustomizationPanel;