'use client';

import { Button } from '@tokens/ui/button';
import type { ProjectDoc } from '@/lib/dashboard-types';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCalendar, IconEllipsis } from 'symbols-react';
import { ProjectSettingsDialog } from './project-settings-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tokens/ui/tooltip';

interface ProjectHeaderProps {
    project: ProjectDoc | null | undefined;
}

export const ProjectHeader = memo(function ProjectHeader({ project }: ProjectHeaderProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const router = useRouter();

    if (!project) {
        return (
            <div className="mb-8 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse motion-reduce:animate-none"></div>
                        <div className="h-8 w-8 bg-zinc-800 rounded shrink-0 animate-pulse motion-reduce:animate-none"></div>
                    </div>
                    <div className="h-4 bg-zinc-800 rounded w-32 animate-pulse motion-reduce:animate-none"></div>
                </div>
                <div className="h-32 bg-zinc-800/50 rounded-lg animate-pulse motion-reduce:animate-none"></div>
            </div>
        );
    }

    return (
        <div className="mb-8 space-y-6">
            {/* Project Info Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSettingsOpen(true)}
                                aria-label="Project settings"
                                className="h-8 w-8 shrink-0 rounded-lg"
                            >
                                <IconEllipsis className="h-4 w-4 fill-zinc-400" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-zinc-800 dark:bg-zinc-900 rounded-sm py-1 px-2">
                            <p className="text-xs text-white">Project settings</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3 fill-zinc-400" />
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                {project.description && <p className="text-sm text-zinc-400 mt-2 max-w-2xl">{project.description}</p>}
            </div>

            {/* Project Settings Dialog */}
            {project && (
                <ProjectSettingsDialog
                    project={project}
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onProjectUpdated={() => {
                        // Refresh project data if needed
                        router.refresh();
                    }}
                    onProjectDeleted={() => {
                        // Redirect to dashboard or projects list
                        router.push('/');
                    }}
                />
            )}
        </div>
    );
});
