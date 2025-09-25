export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string | null;
          owner_id: string;
          start_date: string;
          end_date: string;
          color: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          project_id: string;
          parent_id: string | null;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          progress: number;
          status: 'todo' | 'in_progress' | 'done' | 'blocked';
          assignee_id: string | null;
          order_index: number;
          color: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      task_dependencies: {
        Row: {
          id: string;
          created_at: string;
          predecessor_id: string;
          successor_id: string;
          type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
        };
        Insert: Omit<Database['public']['Tables']['task_dependencies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['task_dependencies']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface TaskWithSubtasks extends Task {
  subtasks?: TaskWithSubtasks[];
  dependencies?: TaskDependency[];
  assignee?: Profile;
}