import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Project } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Create profile if it doesn't exist
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (createError) {
            toast({
              title: "Error",
              description: "Failed to create user profile",
              variant: "destructive"
            });
            return;
          }
          
          profile.id = newProfile.id;
        } else {
          return;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
      
      // Set first project as current if none selected
      if (!currentProject && data && data.length > 0) {
        setCurrentProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (project: Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          owner_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setCurrentProject(data);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProjects(projects.map(p => p.id === id ? data : p));
      if (currentProject?.id === id) {
        setCurrentProject(data);
      }
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(projects.find(p => p.id !== id) || null);
      }
      
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
};