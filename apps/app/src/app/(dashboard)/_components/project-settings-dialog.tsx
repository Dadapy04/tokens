'use client';

import { useState } from 'react';
import { useDashboardMutation } from '@/hooks/use-dashboard-api';
import type { ProjectDoc } from '@/lib/dashboard-types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/app-ui/dialog';
import { Button } from '@tokens/ui/button';
import { Input } from '@tokens/ui/input';
import { Label } from '@tokens/ui/label';
import { Textarea } from '@tokens/ui/textarea';
import { toast } from 'sonner';
import { Spinner } from '@tokens/ui/spinner';

interface ProjectSettingsDialogProps {
    project: ProjectDoc;
    isOpen: boolean;
    onClose: () => void;
    onProjectUpdated?: () => void;
    onProjectDeleted?: () => void;
}

export function ProjectSettingsDialog({
    project,
    isOpen,
    onClose,
    onProjectUpdated,
    onProjectDeleted,
}: ProjectSettingsDialogProps) {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const updateProject = useDashboardMutation<null, { projectId: string; name: string; description?: string }>(
        'usersUpdateProject',
    );
    const deleteProject = useDashboardMutation<null, { projectId: string }>('usersDeleteProject');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Project name is required');
            return;
        }

        setIsUpdating(true);
        try {
            await updateProject({
                projectId: project._id,
                name: name.trim(),
                description: description.trim() || undefined,
            });

            toast.success('Project updated successfully');
            onProjectUpdated?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update project');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmation !== project.name) {
            toast.error("Project name doesn't match");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteProject({ projectId: project._id });

            toast.success('Project deleted successfully');
            onProjectDeleted?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        setName(project.name);
        setDescription(project.description || '');
        setDeleteConfirmation('');
        onClose();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !isUpdating && !isDeleting) {
            handleCancel();
        }
    };

    const isDeleteEnabled = deleteConfirmation === project.name && !isDeleting && !isUpdating;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">Project Settings</DialogTitle>
                    <DialogDescription>
                        Update your project details or delete the project permanently.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-[11px] uppercase text-text-extra-low">
                                Project Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter project name"
                                maxLength={50}
                                required
                                disabled={isUpdating || isDeleting}
                                className="mt-1 rounded-lg bg-zinc-50 focus-visible:bg-white dark:focus-within:bg-zinc-950/50 dark:bg-zinc-900 focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-600/20 focus-visible:border-zinc-400/60 dark:focus-visible:border-zinc-600/80 transition-all duration-150 ease-out"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-[11px] uppercase text-text-extra-low">
                                Description (Optional)
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief description of your project..."
                                maxLength={200}
                                rows={3}
                                disabled={isUpdating || isDeleting}
                                className="mt-1 rounded-lg bg-zinc-50 focus-visible:bg-white dark:focus-within:bg-zinc-950/50 dark:bg-zinc-900 focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-600/20 focus-visible:border-zinc-400/60 dark:focus-visible:border-zinc-600/80 transition-all duration-150 ease-out"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex !flex-col gap-2">
                        <Button type="submit" disabled={isUpdating || !name.trim() || isDeleting} className="w-full">
                            {isUpdating ? (
                                <>
                                    <Spinner />
                                </>
                            ) : (
                                <>Save Changes</>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isUpdating || isDeleting}
                            className="w-full"
                        >
                            Cancel
                        </Button>

                        {/* Danger Zone */}

                        <div className="mt-4 relative p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                            <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                This action cannot be undone. This will permanently delete the project &quot;
                                {project.name}&quot; and all associated data including API keys, settings, and usage
                                data.
                            </p>

                            <div className="grid gap-2 mb-3 relative z-10">
                                <Label
                                    htmlFor="deleteConfirmation"
                                    className="text-[11px] uppercase text-text-extra-low"
                                >
                                    Type &quot;{project.name}&quot; to confirm deletion
                                </Label>
                                <Input
                                    id="deleteConfirmation"
                                    value={deleteConfirmation}
                                    onChange={e => setDeleteConfirmation(e.target.value)}
                                    placeholder={project.name}
                                    disabled={isUpdating || isDeleting}
                                    className="mt-1 rounded-lg bg-zinc-50 focus-visible:bg-white dark:focus-within:bg-zinc-950/50 dark:bg-zinc-900 focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-600/20 focus-visible:border-zinc-400/60 dark:focus-visible:border-zinc-600/80 transition-all duration-150 ease-out"
                                />
                            </div>
                            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                <svg className="h-full w-full opacity-[0.3] dark:opacity-[0.6]">
                                    <defs>
                                        <pattern
                                            id="warning-background"
                                            patternUnits="userSpaceOnUse"
                                            width="40"
                                            height="40"
                                            patternTransform="rotate(45)"
                                        >
                                            <rect
                                                width="20"
                                                height="40"
                                                className="fill-red-500/[0.25] dark:fill-red-500/[0.15]"
                                            />
                                            <rect x="20" width="20" height="40" fill="transparent" />
                                        </pattern>
                                        <mask id="warning-fade-mask">
                                            <linearGradient id="warning-fade-gradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="white" stopOpacity="1" />
                                                <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                                            </linearGradient>
                                            <rect width="100%" height="100%" fill="url(#warning-fade-gradient)" />
                                        </mask>
                                    </defs>
                                    <rect
                                        width="100%"
                                        height="100%"
                                        fill="url(#warning-background)"
                                        mask="url(#warning-fade-mask)"
                                    />
                                </svg>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!isDeleteEnabled}
                            className="w-full"
                        >
                            {isDeleting ? (
                                <>
                                    <Spinner />
                                </>
                            ) : (
                                <>
                                    <span className="text-white">Delete Project</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
