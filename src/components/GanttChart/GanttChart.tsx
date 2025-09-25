import React, { useEffect, useRef, useState } from 'react';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, isWeekend } from 'date-fns';
import { TaskWithSubtasks } from '@/types/database';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Calendar, Users, Clock, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import TaskBar from './TaskBar';
import TimelineHeader from './TimelineHeader';
import { exportGanttChartAsPDF, generateAnalysisReport } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface GanttChartProps {
  tasks: TaskWithSubtasks[];
  startDate: Date;
  endDate: Date;
  onTaskUpdate?: (task: TaskWithSubtasks) => void;
  onTaskClick?: (task: TaskWithSubtasks) => void;
  projectName?: string;
  projectDescription?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  startDate,
  endDate,
  onTaskUpdate,
  onTaskClick,
  projectName = 'Project',
  projectDescription,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [dayWidth, setDayWidth] = useState(40);
  const [scrollLeft, setScrollLeft] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Expand all tasks by default
  useEffect(() => {
    const allTaskIds = new Set<string>();
    const collectIds = (tasks: TaskWithSubtasks[]) => {
      tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          allTaskIds.add(task.id);
          collectIds(task.subtasks);
        }
      });
    };
    collectIds(tasks);
    setExpandedTasks(allTaskIds);
  }, [tasks]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };
  
  const handleExportChart = async () => {
    if (!chartRef.current) return;
    
    try {
      await exportGanttChartAsPDF(chartRef.current, projectName);
      toast({
        title: 'Success',
        description: 'Gantt chart exported as PDF successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export Gantt chart',
        variant: 'destructive',
      });
    }
  };
  
  const handleGenerateReport = () => {
    try {
      generateAnalysisReport(tasks, projectName, projectDescription, startDate, endDate);
      toast({
        title: 'Success',
        description: 'Analysis report generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate analysis report',
        variant: 'destructive',
      });
    }
  };

  const renderTaskRow = (task: TaskWithSubtasks, level: number = 0, parentTask?: TaskWithSubtasks): React.ReactNode[] => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
    const taskOffset = differenceInDays(taskStart, startDate);

    const rows: React.ReactNode[] = [
      <div
        key={task.id}
        className={cn(
          "flex border-b border-border hover:bg-muted/50 transition-colors relative",
          "group"
        )}
      >
        {/* Task List Column */}
        <div className="w-96 flex-shrink-0 border-r border-border bg-card sticky left-0 z-10">
          <div
            className={cn(
              "flex items-center gap-2 p-3 cursor-pointer relative",
              "hover:bg-muted/50 transition-colors"
            )}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
            onClick={() => onTaskClick?.(task)}
          >
            {/* Connection line for subtasks */}
            {level > 0 && (
              <>
                {/* Vertical line from parent */}
                <div
                  className="absolute border-l-2 border-dashed border-muted-foreground/30"
                  style={{
                    left: `${(level - 1) * 24 + 20}px`,
                    top: 0,
                    bottom: 0,
                  }}
                />
                {/* Horizontal connector */}
                <div
                  className="absolute border-t-2 border-dashed border-muted-foreground/30"
                  style={{
                    left: `${(level - 1) * 24 + 20}px`,
                    width: `${24}px`,
                    top: '50%',
                  }}
                />
              </>
            )}
            
            {hasSubtasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(task.id);
                }}
                className="p-0.5 hover:bg-muted rounded relative z-10"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasSubtasks && <div className="w-5" />}
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{task.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(taskStart, 'MMM d')} - {format(taskEnd, 'MMM d')}</span>
                {task.assignee && (
                  <>
                    <Users className="h-3 w-3 ml-2" />
                    <span>{task.assignee.full_name || task.assignee.email}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  task.status === 'done' ? 'default' :
                  task.status === 'in_progress' ? 'secondary' :
                  task.status === 'blocked' ? 'destructive' : 'outline'
                }
                className="text-xs"
              >
                {task.status.replace('_', ' ')}
              </Badge>
              <div className="text-xs font-medium">{task.progress}%</div>
            </div>
          </div>
        </div>

        {/* Timeline Column */}
        <div
          className="flex-1 relative"
          style={{ width: `${totalDays * dayWidth}px` }}
        >
          <div className="absolute inset-0 gantt-grid-pattern" />
          {/* Weekend highlighting */}
          {Array.from({ length: totalDays }, (_, i) => {
            const currentDate = addDays(startDate, i);
            return isWeekend(currentDate) ? (
              <div
                key={i}
                className="absolute top-0 bottom-0 bg-gantt-weekend"
                style={{
                  left: `${i * dayWidth}px`,
                  width: `${dayWidth}px`,
                }}
              />
            ) : null;
          })}
          
          {/* Connection line from parent task to child in timeline */}
          {level > 0 && parentTask && (
            <div
              className="absolute border-l-2 border-dashed"
              style={{
                borderColor: 'hsl(var(--connection-line))',
                left: `${taskOffset * dayWidth}px`,
                top: '-12px',
                height: '24px',
              }}
            />
          )}
          
          <TaskBar
            task={task}
            startDate={startDate}
            dayWidth={dayWidth}
            level={level}
            onUpdate={onTaskUpdate}
            parentTask={parentTask}
          />
        </div>
      </div>,
    ];

    // Render subtasks if expanded
    if (isExpanded && task.subtasks) {
      task.subtasks.forEach(subtask => {
        rows.push(...renderTaskRow(subtask, level + 1, task));
      });
    }

    return rows;
  };

  return (
    <div ref={chartRef} className="flex flex-col min-h-[600px] h-full bg-background rounded-lg border border-border shadow-lg">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDayWidth(Math.max(20, dayWidth - 10))}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDayWidth(Math.min(100, dayWidth + 10))}
          >
            Zoom In
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              const today = new Date();
              const todayOffset = differenceInDays(today, startDate);
              if (timelineRef.current && todayOffset >= 0 && todayOffset <= totalDays) {
                timelineRef.current.scrollLeft = todayOffset * dayWidth - 200;
              }
            }}
          >
            <Clock className="h-4 w-4 mr-1" />
            Today
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportChart}>
                <FileText className="h-4 w-4 mr-2" />
                Export Chart as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGenerateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Analysis Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header */}
      <div className="flex overflow-hidden border-b border-border">
        <div className="w-96 flex-shrink-0 border-r border-border bg-card sticky left-0 z-20">
          <div className="p-3 font-semibold">Tasks</div>
        </div>
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto"
          onScroll={handleScroll}
        >
          <TimelineHeader
            startDate={startDate}
            endDate={endDate}
            dayWidth={dayWidth}
            totalDays={totalDays}
          />
        </div>
      </div>

      {/* Task Rows */}
      <div className="flex-1 overflow-auto min-h-[400px]">
        {tasks.length > 0 ? (
          <div>
            {tasks.flatMap(task => renderTaskRow(task, 0))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No tasks available. Create a new task to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;