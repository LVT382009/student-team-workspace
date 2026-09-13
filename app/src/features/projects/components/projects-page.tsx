'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ProjectList } from './project-list';
import { CreateProjectDialog } from './create-project-dialog';
import { getProjects, createProject } from '../service';
import { Project, ProjectStatus, CreateProjectPayload } from '../types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

function StatusFilterPills({
  value,
  onChange
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div role='tablist' aria-label='Filter projects by status' className='flex flex-wrap gap-1.5'>
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type='button'
          role='tab'
          aria-selected={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const filteredProjects =
    statusFilter === 'all'
      ? projects
      : projects.filter((project) => project.status === (statusFilter as ProjectStatus));

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProjects();
        if (!isMounted) return;
        setProjects(data);
      } catch (err) {
        if (!isMounted) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleCreate = async (payload: CreateProjectPayload) => {
    setIsSubmitting(true);
    try {
      const project = await createProject(payload);
      setProjects((prev) => [...prev, project]);
      toast.success('Project created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      pageTitle='Projects'
      pageDescription='Manage projects for this workspace.'
      pageHeaderAction={<CreateProjectDialog onSubmit={handleCreate} isSubmitting={isSubmitting} />}
    >
      <div className='mb-4'>
        <StatusFilterPills value={statusFilter} onChange={setStatusFilter} />
      </div>
      {loadError ? (
        <div
          role='alert'
          className='border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'
        >
          <Icons.alertCircle className='text-destructive mt-0.5 size-5 shrink-0' />
          <div className='flex-1'>
            <p className='text-sm font-medium'>Could not load projects</p>
            <p className='text-muted-foreground text-sm'>{loadError}</p>
          </div>
          <Button variant='outline' size='sm' onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      ) : !isLoading && projects.length > 0 && filteredProjects.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          No {statusFilter} projects in this workspace.
        </p>
      ) : (
        <ProjectList
          projects={filteredProjects}
          isLoading={isLoading}
          emptyAction={<CreateProjectDialog onSubmit={handleCreate} isSubmitting={isSubmitting} />}
        />
      )}
    </PageContainer>
  );
}
