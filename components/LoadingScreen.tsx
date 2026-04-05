'use client';

import React from 'react';
import { Box, CircularProgress, Typography, useTheme, alpha } from '@mui/material';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock as ClockIcon, Briefcase as ProfessionalIcon } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut"
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Logo container with pulsing effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/6-removebg-preview.png"
              alt="Time OS Logo"
              width={180}
              height={40}
              objectFit="contain"
              priority={true}
            />
          </motion.div>

          {/* Glowing background behind logo */}
          <Box
            sx={{
              position: 'absolute',
              width: '150%',
              height: '150%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
              zIndex: -1,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </Box>

        {/* Animated Task Icon (Clock/Briefcase) */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <motion.div
            animate={{ 
              rotate: 360 
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ color: theme.palette.primary.main, display: 'flex' }}
          >
            <ClockIcon size={32} strokeWidth={1.5} />
          </motion.div>
          
          <Box 
            sx={{ 
              width: 1, 
              height: 24, 
              bgcolor: alpha(theme.palette.divider, 0.5), 
              borderRadius: 1 
            }} 
          />
          
          <motion.div
            animate={{ 
              y: [0, -4, 0] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ color: theme.palette.primary.main, display: 'flex' }}
          >
            <ProfessionalIcon size={32} strokeWidth={1.5} />
          </motion.div>
        </Box>

        {/* Custom Progress Bar */}
        <Box sx={{ width: 240, height: 6, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 10, mt: 1, overflow: 'hidden', position: 'relative' }}>
          <motion.div
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              borderRadius: 10,
              boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.5)}`
            }}
            animate={{
              width: ["0%", "100%"],
              left: ["-100%", "100%"]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.05em',
            mt: 2,
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            fontSize: '1.1rem'
          }}
        >
          {/* Pulsing text effect */}
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Enhancing Your Productivity...
          </motion.span>
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary', 
            fontWeight: 500,
            opacity: 0.6,
            mt: -1
          }}
        >
          Powering up your workspace
        </Typography>
      </motion.div>

      {/* Decorative floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
            borderRadius: '50%',
            background: i % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
            opacity: 0.15,
            zIndex: -1,
          }}
          animate={{
            x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          initial={{
            top: `${20 + Math.random() * 60}%`,
            left: `${20 + Math.random() * 60}%`,
          }}
        />
      ))}
    </Box>
  );
};

export default LoadingScreen;
