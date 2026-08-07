'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useDashboardMutation, useDashboardQuery } from '@/hooks/use-dashboard-api';
import type { ProjectLimitsInfo } from '@/lib/dashboard-types';
import { Button } from '@tokens/ui/button';
import { Input } from '@tokens/ui/input';
import { Label } from '@tokens/ui/label';
import { Textarea } from '@tokens/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/app-ui/dialog';
import { toast } from 'sonner';

interface CreateProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectDialog({ isOpen, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const { isLoaded, isSignedIn } = useAuth();
    const isAuthenticated = Boolean(isLoaded && isSignedIn);
    const createProject = useDashboardMutation<{ projectId: string }, { name: string; description?: string }>(
        'usersCreateProjectWithApiKey',
    );
    const { data: projectLimits } = useDashboardQuery<ProjectLimitsInfo>(
        'usersGetUserProjectLimits',
        isAuthenticated ? {} : 'skip',
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter a project name');
            return;
        }

        setIsCreating(true);

        try {
            const result = await createProject({
                name: name.trim(),
                description: description.trim() || undefined,
            });

            toast.success('Project created successfully!');

            // Reset form
            setName('');
            setDescription('');

            // Close dialog
            onOpenChange(false);

            // Notify parent of new project
            if (onProjectCreated) {
                onProjectCreated(result.projectId);
            }
        } catch (error) {
            // Improved error handling with more user-friendly messages
            let errorMessage = 'Something went wrong. Please try again.';

            if (error instanceof Error) {
                // Use the backend message for known errors
                if (
                    error.message.includes('limit') ||
                    error.message.includes('already have') ||
                    error.message.includes('sign in')
                ) {
                    errorMessage = error.message;
                } else if (error.message.includes('name already exists')) {
                    errorMessage = 'A project with this name already exists. Please choose a different name.';
                } else if (error.message.includes('authentication') || error.message.includes('authorized')) {
                    errorMessage = 'Please sign in to create a project.';
                }
            }

            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancel = () => {
        setName('');
        setDescription('');
        onOpenChange(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !isCreating) {
            // Only allow closing if not currently creating
            handleCancel();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">Create New Project</DialogTitle>
                    <DialogDescription>
                        Create a new project to separate your API usage, keys, and settings.
                        {/* {projectLimits && (
                <span className="block mt-2 text-sm">
                  Projects: {projectLimits.currentCount}/{projectLimits.maxProjects} 
                  {projectLimits.tier === "free" && (
                    <span className="text-muted-foreground"> (Upgrade to Pro for more)</span>
                  )}
                </span>
              )} */}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-[11px] uppercase text-text-extra-low">
                                Project Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="My Awesome Project"
                                maxLength={50}
                                required
                                disabled={isCreating}
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
                                disabled={isCreating}
                                className="mt-1 rounded-lg bg-zinc-50 focus-visible:bg-white dark:focus-within:bg-zinc-950/50 dark:bg-zinc-900 focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-600/20 focus-visible:border-zinc-400/60 dark:focus-visible:border-zinc-600/80 transition-all duration-150 ease-out"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex !flex-col gap-2">
                        <Button
                            type="submit"
                            disabled={isCreating || !name.trim() || !projectLimits?.canCreateMore}
                            className="w-full"
                        >
                            {isCreating ? 'Creating...' : 'Create Project'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isCreating}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
