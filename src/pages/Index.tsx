import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import GanttChart from '@/components/GanttChart/GanttChart';
import TaskList from '@/components/TaskManager/TaskList';
import TaskForm from '@/components/TaskManager/TaskForm';
import ProjectSelector from '@/components/ProjectSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskWithSubtasks } from '@/types/database';
import { Plus, Calendar, List, BarChart3, LogOut } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    loading: projectsLoading,
    createProject
  } = useProjects();
  
  const { 
    tasks, 
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    addDependency,
    removeDependency
  } = useTasks(currentProject?.id);

  const [selectedTask, setSelectedTask] = useState<TaskWithSubtasks | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Auto-create first project if none exist
  useEffect(() => {
    if (!projectsLoading && projects.length === 0 && user) {
      createProject({
        name: 'My First Project',
        description: 'Welcome to your first project!',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        color: '#3b82f6'
      });
    }
  }, [projectsLoading, projects, user]);

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Helper function to find a task by ID
  const findTaskById = (taskList: TaskWithSubtasks[], id: string): TaskWithSubtasks | null => {
    for (const task of taskList) {
      if (task.id === id) {
        return task;
      }
      if (task.subtasks) {
        const found = findTaskById(task.subtasks, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleTaskCreate = async (data: any) => {
    if (!currentProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    await createTask({
      project_id: currentProject.id,
      parent_id: parentTaskId,
      title: data.title,
      description: data.description || null,
      start_date: format(data.start_date, 'yyyy-MM-dd'),
      end_date: format(data.end_date, 'yyyy-MM-dd'),
      progress: data.progress,
      status: data.status,
      assignee_id: data.assignee_id || null,
      order_index: tasks.length,
      color: currentProject.color
    });
    
    setParentTaskId(null);
  };

  const handleTaskUpdate = async (updatedTask: TaskWithSubtasks) => {
    await updateTask(updatedTask.id, {
      title: updatedTask.title,
      description: updatedTask.description,
      start_date: updatedTask.start_date,
      end_date: updatedTask.end_date,
      progress: updatedTask.progress,
      status: updatedTask.status,
      assignee_id: updatedTask.assignee_id,
      color: updatedTask.color
    });
  };

  const handleTaskEdit = async (data: any) => {
    if (!editingTask) return;
    
    await updateTask(editingTask.id, {
      title: data.title,
      description: data.description || null,
      start_date: format(data.start_date, 'yyyy-MM-dd'),
      end_date: format(data.end_date, 'yyyy-MM-dd'),
      progress: data.progress,
      status: data.status,
      assignee_id: data.assignee_id || null
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Gantt Chart Manager
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ProjectSelector
                projects={projects}
                currentProject={currentProject}
                onProjectSelect={setCurrentProject}
                onProjectCreate={createProject}
                loading={projectsLoading}
              />
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!currentProject ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No project selected</p>
              <p className="text-sm text-muted-foreground">
                Create or select a project to start managing tasks
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{currentProject.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentProject.description || 'Manage your tasks and track project progress'}
                </p>
              </div>
              <Button 
                variant="gradient"
                onClick={() => {
                  setEditingTask(null);
                  setParentTaskId(null);
                  setIsTaskFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>

            <Tabs defaultValue="gantt" className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="gantt">
                  <Calendar className="h-4 w-4 mr-2" />
                  Gantt Chart
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  Task List
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gantt" className="space-y-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0 min-h-[600px]">
                    {tasksLoading ? (
                      <div className="flex items-center justify-center h-[600px]">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
                        </div>
                      </div>
                    ) : (
                      <GanttChart
                        tasks={tasks}
                        startDate={(() => {
                          // Find the earliest start date from all tasks
                          let earliestDate = new Date(currentProject.start_date);
                          const findEarliestDate = (taskList: TaskWithSubtasks[]) => {
                            taskList.forEach(task => {
                              const taskStart = new Date(task.start_date);
                              if (taskStart < earliestDate) {
                                earliestDate = taskStart;
                              }
                              if (task.subtasks) {
                                findEarliestDate(task.subtasks);
                              }
                            });
                          };
                          findEarliestDate(tasks);
                          // Add 7 days buffer before the earliest date
                          return new Date(earliestDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                        })()}
                        endDate={(() => {
                          // Find the latest end date from all tasks
                          let latestDate = new Date(currentProject.end_date);
                          const findLatestDate = (taskList: TaskWithSubtasks[]) => {
                            taskList.forEach(task => {
                              const taskEnd = new Date(task.end_date);
                              if (taskEnd > latestDate) {
                                latestDate = taskEnd;
                              }
                              if (task.subtasks) {
                                findLatestDate(task.subtasks);
                              }
                            });
                          };
                          findLatestDate(tasks);
                          // Add 7 days buffer after the latest date
                          return new Date(latestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                        })()}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskClick={setSelectedTask}
                        projectName={currentProject.name}
                        projectDescription={currentProject.description || undefined}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                {tasksLoading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <TaskList
                    tasks={tasks}
                    selectedTaskId={selectedTask?.id}
                    onTaskSelect={setSelectedTask}
                    onTaskEdit={task => {
                      setEditingTask(task);
                      setParentTaskId(null);
                      setIsTaskFormOpen(true);
                    }}
                    onTaskDelete={taskId => {
                      deleteTask(taskId);
                    }}
                    onAddSubtask={parentId => {
                      setEditingTask(null);
                      setParentTaskId(parentId);
                      setIsTaskFormOpen(true);
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Task Form Dialog */}
      <TaskForm
        task={editingTask || undefined}
        open={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
          setParentTaskId(null);
        }}
        onSubmit={editingTask ? handleTaskEdit : handleTaskCreate}
        isSubtask={!!parentTaskId}
        parentTaskTitle={parentTaskId ? findTaskById(tasks, parentTaskId)?.title : undefined}
      />
    </div>
  );
};

export default Index;