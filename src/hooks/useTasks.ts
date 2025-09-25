import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskWithSubtasks } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useTasks = (projectId: string | undefined) => {
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all tasks for the project
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch task dependencies
      const { data: depsData, error: depsError } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('successor_id', tasksData?.map(t => t.id) || []);

      if (depsError) throw depsError;

      // Build task hierarchy
      const tasksMap = new Map<string, TaskWithSubtasks>();
      const rootTasks: TaskWithSubtasks[] = [];

      // First pass: create all tasks
      tasksData?.forEach(task => {
        const taskDeps = depsData?.filter(d => d.successor_id === task.id).map(d => ({
          ...d,
          type: d.type as "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish"
        })) || [];
        tasksMap.set(task.id, {
          ...task,
          status: (task.status || 'todo') as "todo" | "in_progress" | "done" | "blocked",
          subtasks: [],
          dependencies: taskDeps
        } as TaskWithSubtasks);
      });

      // Second pass: build hierarchy
      tasksData?.forEach(task => {
        const taskWithSubtasks = tasksMap.get(task.id)!;
        if (task.parent_id) {
          const parent = tasksMap.get(task.parent_id);
          if (parent) {
            parent.subtasks = parent.subtasks || [];
            parent.subtasks.push(taskWithSubtasks);
          }
        } else {
          rootTasks.push(taskWithSubtasks);
        }
      });

      setTasks(rootTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      toast({
        title: "Success",
        description: "Task created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // First delete all subtasks
      const { error: subtasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('parent_id', id);

      if (subtasksError) throw subtasksError;

      // Then delete the task itself
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
      return false;
    }
  };

  const addDependency = async (predecessorId: string, successorId: string, type: string = 'finish_to_start') => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert({
          predecessor_id: predecessorId,
          successor_id: successorId,
          type
        });

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      toast({
        title: "Success",
        description: "Dependency added successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error adding dependency:', error);
      toast({
        title: "Error",
        description: "Failed to add dependency",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeDependency = async (predecessorId: string, successorId: string) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('predecessor_id', predecessorId)
        .eq('successor_id', successorId);

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      toast({
        title: "Success",
        description: "Dependency removed successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error removing dependency:', error);
      toast({
        title: "Error",
        description: "Failed to remove dependency",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateTaskOrder = async (taskId: string, newIndex: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ order_index: newIndex })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      
      return true;
    } catch (error) {
      console.error('Error updating task order:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    addDependency,
    removeDependency,
    updateTaskOrder,
    refetch: fetchTasks
  };
};