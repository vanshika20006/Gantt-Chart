# Hierarchical Gantt Chart App - Deployment Guide

## Overview
This is a complete hierarchical Gantt Chart application built with React, TypeScript, Tailwind CSS, and Supabase. It supports unlimited nested subtasks, drag-and-drop task management, and real-time updates.

## Features
- ✅ **Unlimited Hierarchical Subtasks** - Nested tasks with no depth limit
- ✅ **Interactive Gantt Chart** - Drag to move, resize tasks on timeline
- ✅ **Task Dependencies** - Visual connections between related tasks
- ✅ **Real-time Collaboration** - Live updates across users
- ✅ **Authentication** - Secure user accounts with Supabase Auth
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Multiple Views** - Gantt chart and list views
- ✅ **Progress Tracking** - Visual progress indicators for each task

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query
- **Drag & Drop**: @dnd-kit
- **Date Handling**: date-fns

## Project Structure
```
src/
├── components/
│   ├── GanttChart/
│   │   ├── GanttChart.tsx      # Main Gantt chart component
│   │   ├── TaskBar.tsx         # Individual task bars
│   │   └── TimelineHeader.tsx  # Timeline header with dates
│   ├── TaskManager/
│   │   ├── TaskList.tsx        # Hierarchical task list view
│   │   └── TaskForm.tsx        # Task creation/editing form
│   ├── Auth/
│   │   └── LoginForm.tsx       # Authentication component
│   └── ui/                     # Reusable UI components
├── hooks/
│   └── useAuth.tsx             # Authentication hook
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── types/
│   └── database.ts            # TypeScript type definitions
└── pages/
    └── Index.tsx              # Main application page
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (free tier available)

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy the content from `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL to create tables and policies

3. Get your project credentials:
   - Go to Settings > API
   - Copy the `Project URL` and `anon public` key

### 3. Frontend Configuration

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Update Supabase configuration in `src/lib/supabase.ts`:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### 4. Production Deployment

#### Option A: Deploy with Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

#### Option B: Deploy with Netlify
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

#### Option C: Self-hosted
1. Build the project:
   ```bash
   npm run build
   ```
2. Serve the `dist` folder with any static server (nginx, Apache, etc.)

## Database Schema

### Tables
- **profiles**: User profiles linked to auth.users
- **projects**: Project containers for tasks
- **tasks**: Hierarchical task structure with parent_id for nesting
- **task_dependencies**: Links between dependent tasks

### Key Features
- Row Level Security (RLS) enabled for all tables
- Automatic timestamp updates
- UUID primary keys for all records
- Recursive CTE function for fetching task hierarchies

## API Integration

The app uses Supabase's auto-generated REST API. Key operations:

```typescript
// Fetch tasks with subtasks
const fetchTaskHierarchy = async (projectId: string) => {
  const { data } = await supabase
    .from('tasks')
    .select(`
      *,
      subtasks:tasks!parent_id(*)
    `)
    .eq('project_id', projectId)
    .is('parent_id', null);
  return data;
};

// Update task dates (drag & drop)
const updateTaskDates = async (taskId: string, startDate: string, endDate: string) => {
  const { data } = await supabase
    .from('tasks')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', taskId);
  return data;
};
```

## Real-time Updates

Enable real-time subscriptions for live updates:

```typescript
// Subscribe to task changes
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      // Handle real-time updates
      console.log('Task changed:', payload);
    }
  )
  .subscribe();
```

## Customization

### Adding Custom Task Fields
1. Add column to `tasks` table in Supabase
2. Update `TaskWithSubtasks` interface in `src/types/database.ts`
3. Add field to `TaskForm` component
4. Update `TaskBar` to display new field

### Changing Color Scheme
Edit `src/index.css` to modify the design tokens:
```css
:root {
  --primary: 217 91% 60%;  /* Change primary color */
  --task-todo: 215 20% 65%; /* Change task status colors */
}
```

### Adding New Task Status
1. Update database constraint in Supabase
2. Add new status to type definition
3. Update status color mapping in components

## Performance Optimization

- Tasks are loaded with their immediate children only
- Lazy loading for deeply nested structures
- Virtual scrolling for large task lists (can be added)
- Debounced drag operations to reduce API calls

## Security Considerations

- All database operations use Row Level Security
- Users can only access their own projects and tasks
- API keys are public (anon key) - secure operations require auth
- Consider implementing rate limiting for production

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase Auth settings
   - Verify email confirmation is disabled for testing

2. **Tasks not saving**
   - Check RLS policies are properly configured
   - Verify user is authenticated

3. **Drag and drop not updating**
   - Check browser console for errors
   - Verify Supabase connection is active

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- React documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com

## License

MIT License - feel free to use for personal or commercial projects.