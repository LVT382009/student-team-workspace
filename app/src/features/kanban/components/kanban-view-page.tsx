'use client';

import { useQueryState } from 'nuqs';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { Project } from '@/features/projects/types';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage() {
  const { projects, isLoading } = useProjects();
  // Selected project lives in the URL so kbar search results can deep-link
  // straight into a project's board (/dashboard/kanban?project=<id>).
  const [selectedProjectId, setSelectedProjectId] = useQueryState('project', {
    defaultValue: ''
  });

  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks with drag and drop'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <ProjectSelect
            projects={projects}
            selectedProjectId={selectedProjectId}
            onChange={setSelectedProjectId}
            isLoading={isLoading}
          />
          <NewTaskDialog onSubmit={() => {}} />
        </div>
      }
    >
      {selectedProjectId ? (
        <KanbanBoard key={selectedProjectId} projectId={selectedProjectId} />
      ) : (
        <EmptyState projects={projects} isLoading={isLoading} onSelect={setSelectedProjectId} />
      )}
    </PageContainer>
  );
}

interface ProjectSelectProps {
  projects: Project[];
  selectedProjectId: string;
  isLoading: boolean;
  onChange: (projectId: string) => void;
}

function ProjectSelect({ projects, selectedProjectId, isLoading, onChange }: ProjectSelectProps) {
  if (isLoading) {
    return <Skeleton className='h-9 w-[200px] rounded-md' />;
  }
  return (
    <Select value={selectedProjectId} onValueChange={(value) => onChange(value ?? '')}>
      <SelectTrigger className='w-[200px]'>
        <SelectValue placeholder='Select project' />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface EmptyStateProps {
  projects: Project[];
  isLoading: boolean;
  onSelect: (projectId: string) => void;
}

function BoardSkeleton() {
  // Column-shaped placeholders matching the kanban board layout (3 columns,
  // a few card blocks each) so the loading state mirrors the final shape.
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3' aria-busy='true' aria-label='Loading projects'>
      {[0, 1, 2].map((col) => (
        <div key={col} className='bg-muted/40 flex flex-col gap-3 rounded-xl border p-3'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-20 w-full rounded-lg' />
          <Skeleton className='h-20 w-full rounded-lg' />
          {col === 0 && <Skeleton className='h-20 w-full rounded-lg' />}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ projects, isLoading, onSelect }: EmptyStateProps) {
  if (isLoading) {
    return <BoardSkeleton />;
  }
  if (projects.length === 0) {
    return (
      <Empty className='border py-16'>
        <EmptyHeader>
          <EmptyMedia variant='icon' className='size-12 rounded-full'>
            <Icons.kanban className='size-6' />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Create a project from the Projects page first, then come back to manage its board.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            render={<Link href='/dashboard/projects' aria-label='Go to Projects' />}
            variant='outline'
            size='sm'
          >
            Go to Projects
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <Empty className='border p-8'>
      <EmptyHeader>
        <EmptyTitle>Select a project to view its kanban board</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <div className='flex flex-wrap justify-center gap-2'>
          {projects.slice(0, 5).map((project) => (
            <Button
              key={project.id}
              variant='outline'
              size='sm'
              onClick={() => onSelect(project.id)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </EmptyContent>
    </Empty>
  );
}
