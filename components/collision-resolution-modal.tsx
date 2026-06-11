import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/lib/scheduling-collision';

interface CollisionResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTask: Task | null;
  newTask: Task | null;
  suggestedSlots: Date[];
  onQuickFix: (newTask: Task, newSlot: Date) => void;
  onManualOverride: () => void;
}

export const CollisionResolutionModal: React.FC<CollisionResolutionModalProps> = ({
  isOpen,
  onClose,
  existingTask,
  newTask,
  suggestedSlots,
  onQuickFix,
  onManualOverride,
}) => {
  if (!isOpen || !existingTask || !newTask) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Professional': return 'bg-blue-50 text-blue-800 border-blue-200 shadow-[inset_0_1px_3px_rgba(59,130,246,0.1)]';
      case 'Personal': return 'bg-green-50 text-green-800 border-green-200 shadow-[inset_0_1px_3px_rgba(34,197,94,0.1)]';
      case 'Note-Taking': return 'bg-orange-50 text-orange-800 border-orange-200 shadow-[inset_0_1px_3px_rgba(249,115,22,0.1)]';
      default: return 'bg-gray-50 text-gray-800 border-gray-200 shadow-[inset_0_1px_3px_rgba(156,163,175,0.1)]';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] p-6 relative overflow-hidden"
        >
          {/* Subtle top glare effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          
          {/* Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl shadow-sm border border-red-100/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Time Slot Conflict</h2>
              <p className="text-sm text-gray-500 mt-1">This time slot is already occupied.</p>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="mb-8 space-y-3 relative">
            {/* Existing Task */}
            <div className={`p-4 rounded-2xl border flex flex-col space-y-2 relative overflow-hidden ${getCategoryColor(existingTask.category)}`}>
              <div className="flex justify-between items-start z-10">
                <span className="font-semibold">{existingTask.title} (Existing)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/60 rounded-md">
                  {existingTask.category}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm opacity-80 z-10 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(existingTask.startTime)} - {formatTime(existingTask.endTime)}</span>
              </div>
            </div>
            
            {/* Connection line indicator */}
            <div className="flex items-center justify-center -my-2 relative z-10">
              <div className="bg-white p-1 rounded-full border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* New Task */}
            <div className={`p-4 rounded-2xl border border-dashed flex flex-col space-y-2 relative overflow-hidden ${getCategoryColor(newTask.category)}`}>
               <div className="absolute inset-0 bg-white/40" />
               <div className="flex justify-between items-start z-10">
                <span className="font-semibold">{newTask.title} (New)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/60 rounded-md">
                  {newTask.category}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm opacity-80 z-10 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(newTask.startTime)} - {formatTime(newTask.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            
            {/* Option 1 */}
            <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-800 mb-3 font-bold uppercase tracking-wider">Option 1: Quick Fix</p>
              <p className="text-xs text-gray-500 mb-3">Instantly reschedule the new task to a free slot.</p>
              
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {suggestedSlots.length > 0 ? suggestedSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => onQuickFix(newTask, slot)}
                    className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-gray-200"
                  >
                    {formatTime(slot)}
                  </button>
                )) : (
                  <p className="text-sm text-gray-500 italic text-center w-full py-2">No available slots found.</p>
                )}
              </div>
            </div>

            {/* Option 2 */}
            <div className="w-full">
               <button
                  onClick={onManualOverride}
                  className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 flex justify-center items-center gap-2"
                >
                  Option 2: Manual Override
                </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-sm font-semibold rounded-2xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
