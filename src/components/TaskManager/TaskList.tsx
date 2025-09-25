import React, { useState } from 'react';
import { TaskWithSubtasks } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: TaskWithSubtasks[];
  onTaskSelect?: (task: TaskWithSubtasks) => void;
  onTaskEdit?: (task: TaskWithSubtasks) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddSubtask?: (parentId: string) => void;
  selectedTaskId?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,
  onAddSubtask,
  selectedTaskId,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderTask = (task: TaskWithSubtasks, level: number = 0): React.ReactNode => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isSelected = selectedTaskId === task.id;

    return (
      <div key={task.id}>
        <div
          className={cn(
            "group relative flex items-center gap-3 p-3 rounded-lg transition-all hover-lift",
            "hover:bg-muted/50 cursor-pointer",
            isSelected && "bg-primary-light ring-2 ring-primary"
          )}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => onTaskSelect?.(task)}
        >
          {/* Expand/Collapse Button */}
          {hasSubtasks ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(task.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Checkbox */}
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={(checked) => {
              // Handle task completion
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium",
                  task.status === 'done' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}</span>
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{task.assignee.full_name || task.assignee.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="w-24">
            <Progress value={task.progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{task.progress}%</span>
          </div>

          {/* Status Badge */}
          <Badge variant={getStatusColor(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubtask?.(task.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subtask
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onTaskDelete?.(task.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render Subtasks */}
        {isExpanded && task.subtasks && (
          <div className="ml-4 border-l-2 border-border">
            {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="space-y-1">
        {tasks.map(task => renderTask(task))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks yet. Create your first task to get started.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskList;