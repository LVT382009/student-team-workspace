'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Icons } from '@/components/icons';
import { Project, ProjectStatus } from '../types';

function StatusBadge({ status }: { status: ProjectStatus }) {
  const variant: Record<ProjectStatus, { icon: keyof typeof Icons; className: string }> = {
    active: { icon: 'check', className: 'bg-emerald-500/10 text-emerald-500' },
    archived: { icon: 'archive', className: 'bg-amber-500/10 text-amber-500' },
    completed: { icon: 'check', className: 'bg-blue-500/10 text-blue-500' }
  };

  const { icon, className } = variant[status] ?? variant.active;
  const Icon = Icons[icon];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className='size-3.5' />
      {status}
    </span>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className='transition-colors hover:bg-muted/20'>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-3'>
          <CardTitle className='line-clamp-1 text-base'>{project.name}</CardTitle>
          <StatusBadge status={project.status} />
        </div>
        <CardDescription className='line-clamp-2'>
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0 text-xs text-muted-foreground'>
        <div className='flex items-center gap-4'>
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className='h-40'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-5 w-3/5' />
            <Skeleton className='mt-2 h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-4/5' />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  /** Optional CTA rendered inside the empty state (e.g. CreateProjectDialog). */
  emptyAction?: React.ReactNode;
}

export function ProjectList({ projects, isLoading, emptyAction }: ProjectListProps) {
  if (isLoading) {
    return <ProjectGridSkeleton />;
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
            Create your first project to start organizing work for this workspace.
          </EmptyDescription>
        </EmptyHeader>
        {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
      </Empty>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
