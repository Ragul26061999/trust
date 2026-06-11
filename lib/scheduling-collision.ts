// types for tasks and collision logic

export type TaskCategory = 'Professional' | 'Personal' | 'Note-Taking';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: Date; // Keep as Date objects for easier manipulation
  endTime: Date;
  description?: string;
}

// Check if two time ranges overlap
export const checkTimeOverlap = (newStart: Date, newEnd: Date, existingStart: Date, existingEnd: Date): boolean => {
  return (newStart < existingEnd) && (newEnd > existingStart);
};

// Given a list of existing tasks and a new task, find if there is a collision
export const findCollision = (newTask: Task, existingTasks: Task[]): Task | null => {
  for (const existingTask of existingTasks) {
    if (checkTimeOverlap(newTask.startTime, newTask.endTime, existingTask.startTime, existingTask.endTime)) {
      return existingTask;
    }
  }
  return null;
};

// Recommendation engine to find the next available slots for a task duration
export const getSuggestedTimeSlots = (
  taskDuration: number, // in minutes
  existingTasks: Task[],
  activeHours: { start: number; end: number } = { start: 8, end: 22 } // 8 AM to 10 PM
): Date[] => {
  if (existingTasks.length === 0) {
      // If no existing tasks, just return some defaults (e.g. starting now or next active hour)
      return [];
  }
  
  // Use the date from the first existing task, or today if none
  const targetDate = existingTasks.length > 0 ? existingTasks[0].startTime : new Date();
  const bufferMinutes = 5;
  const numberOfSuggestions = 3;

  // Extract only tasks for the target date
  const targetDayStart = new Date(targetDate);
  targetDayStart.setHours(0, 0, 0, 0);
  const targetDayEnd = new Date(targetDate);
  targetDayEnd.setHours(23, 59, 59, 999);

  const dayTasks = existingTasks.filter(
    (t) => t.startTime >= targetDayStart && t.endTime <= targetDayEnd
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let currentPointer = new Date(targetDate);
  currentPointer.setHours(activeHours.start, 0, 0, 0);
  
  const endOfDayPointer = new Date(targetDate);
  endOfDayPointer.setHours(activeHours.end, 0, 0, 0);

  const suggestions: Date[] = [];
  
  while (currentPointer < endOfDayPointer && suggestions.length < numberOfSuggestions) {
    const potentialStart = new Date(currentPointer);
    const potentialEnd = new Date(potentialStart.getTime() + taskDuration * 60000);
    
    // Ensure potential end is within active hours
    if (potentialEnd > endOfDayPointer) {
      break; 
    }

    // Check for collision with any day tasks, considering buffer time
    const potentialStartWithBuffer = new Date(potentialStart.getTime() - bufferMinutes * 60000);
    const potentialEndWithBuffer = new Date(potentialEnd.getTime() + bufferMinutes * 60000);

    const collision = dayTasks.find(t => 
      checkTimeOverlap(potentialStartWithBuffer, potentialEndWithBuffer, t.startTime, t.endTime)
    );

    if (!collision) {
      suggestions.push(potentialStart);
      currentPointer = new Date(potentialStart.getTime() + (taskDuration + bufferMinutes) * 60000);
    } else {
      currentPointer = new Date(collision.endTime.getTime() + bufferMinutes * 60000);
    }
  }

  return suggestions;
};
