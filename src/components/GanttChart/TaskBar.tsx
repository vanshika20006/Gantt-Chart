import React, { useRef, useState } from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import { TaskWithSubtasks } from '@/types/database';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { Progress } from '@/components/ui/progress';

interface TaskBarProps {
  task: TaskWithSubtasks;
  startDate: Date;
  dayWidth: number;
  level: number;
  onUpdate?: (task: TaskWithSubtasks) => void;
  parentTask?: TaskWithSubtasks;
}

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  startDate,
  dayWidth,
  level,
  onUpdate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  
  const taskStart = new Date(task.start_date);
  const taskEnd = new Date(task.end_date);
  const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
  const taskOffset = differenceInDays(taskStart, startDate);

  // Generate vibrant colors based on task ID for consistency
  const getTaskColor = (taskId: string) => {
    const colors = [
      { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(118, 75, 162, 0.3)' }, // Purple
      { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(245, 87, 108, 0.3)' }, // Pink
      { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', shadow: 'rgba(0, 242, 254, 0.3)' }, // Cyan
      { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', shadow: 'rgba(56, 249, 215, 0.3)' }, // Green
      { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', shadow: 'rgba(254, 225, 64, 0.3)' }, // Warm
      { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', shadow: 'rgba(48, 207, 208, 0.3)' }, // Ocean
      { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', shadow: 'rgba(254, 214, 227, 0.3)' }, // Soft
      { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', shadow: 'rgba(254, 207, 239, 0.3)' }, // Rose
      { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', shadow: 'rgba(252, 182, 159, 0.3)' }, // Peach
      { gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', shadow: 'rgba(191, 233, 255, 0.3)' }, // Sunset
      { gradient: 'linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)', shadow: 'rgba(212, 252, 121, 0.3)' }, // Lime
      { gradient: 'linear-gradient(135deg, #fd8451 0%, #ffbd6f 100%)', shadow: 'rgba(255, 189, 111, 0.3)' }, // Orange
      { gradient: 'linear-gradient(135deg, #8BC34A 0%, #CDDC39 100%)', shadow: 'rgba(205, 220, 57, 0.3)' }, // Light Green
      { gradient: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)', shadow: 'rgba(156, 39, 176, 0.3)' }, // Magenta
      { gradient: 'linear-gradient(135deg, #00BCD4 0%, #009688 100%)', shadow: 'rgba(0, 150, 136, 0.3)' }, // Teal
    ];
    
    // Generate consistent color index based on task ID
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      hash = taskId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getTaskStyle = () => {
    const colorSet = getTaskColor(task.id);
    return {
      background: colorSet.gradient,
      boxShadow: `0 4px 12px ${colorSet.shadow}`,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'left' | 'right' | 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(type);
    }

    const startX = e.clientX;
    const startLeft = taskOffset * dayWidth;
    const startWidth = taskDuration * dayWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      
      if (type === 'move') {
        const newOffset = Math.round((startLeft + deltaX) / dayWidth);
        const newStartDate = addDays(startDate, newOffset);
        const newEndDate = addDays(newStartDate, taskDuration - 1);
        
        if (onUpdate && newOffset >= 0) {
          onUpdate({
            ...task,
            start_date: format(newStartDate, 'yyyy-MM-dd'),
            end_date: format(newEndDate, 'yyyy-MM-dd'),
          });
        }
      } else if (type === 'left') {
        const newOffset = Math.round((startLeft + deltaX) / dayWidth);
        const newStartDate = addDays(startDate, newOffset);
        
        if (onUpdate && newOffset >= 0 && newOffset < taskOffset + taskDuration) {
          onUpdate({
            ...task,
            start_date: format(newStartDate, 'yyyy-MM-dd'),
          });
        }
      } else if (type === 'right') {
        const newDuration = Math.round((startWidth + deltaX) / dayWidth);
        const newEndDate = addDays(taskStart, newDuration - 1);
        
        if (onUpdate && newDuration > 0) {
          onUpdate({
            ...task,
            end_date: format(newEndDate, 'yyyy-MM-dd'),
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const taskStyle = getTaskStyle();

  return (
    <div
      ref={barRef}
      className={cn(
        "absolute top-3 rounded-lg transition-all group/bar",
        "hover:shadow-xl hover:z-10 hover:scale-[1.02]",
        isDragging && "opacity-75 cursor-move",
        isResizing && "cursor-ew-resize"
      )}
      style={{
        left: `${taskOffset * dayWidth + 4}px`,
        width: `${taskDuration * dayWidth - 8}px`,
        height: `${36 - level * 3}px`,
        ...taskStyle,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20"
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20"
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      />

      {/* Task content */}
      <div className="px-2 py-1 h-full flex items-center gap-2">
        <span className="text-xs text-white font-medium truncate">
          {task.title}
        </span>
        {task.progress > 0 && (
          <div className="flex-1 max-w-[60px]">
            <Progress 
              value={task.progress} 
              className="h-1 bg-white/30"
            />
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute -top-8 left-0 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg px-2 py-1 whitespace-nowrap">
          <div className="font-medium">{task.title}</div>
          <div>{format(taskStart, 'MMM d')} - {format(taskEnd, 'MMM d')} ({taskDuration} days)</div>
          <div>Progress: {task.progress}%</div>
        </div>
      </div>

      {/* Dependencies lines would be rendered here */}
    </div>
  );
};

export default TaskBar;