'use client';

import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import { TooltipProvider } from '@tokens/ui/tooltip';
import { DashboardApiProvider } from '@/hooks/use-dashboard-api';
import { SelectedProjectProvider } from '@/hooks/use-selected-project';
import { UserSync } from '@/providers/user-sync';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            <DashboardApiProvider>
                <UserSync />
                <SelectedProjectProvider>
                    <TooltipProvider>
                        <NuqsAdapter>{children}</NuqsAdapter>
                        <Toaster
                            position="bottom-center"
                            toastOptions={{
                                classNames: {
                                    toast: '!rounded-xl !border !border-border !bg-background !text-foreground !shadow-xl !items-start',
                                    title: '!text-sm !font-medium',
                                    description: '!text-xs !text-muted-foreground',
                                    actionButton:
                                        '!rounded-md !bg-foreground !text-background !text-xs !font-medium !px-2.5 !py-1.5 hover:!opacity-90',
                                    cancelButton:
                                        '!rounded-md !bg-transparent !text-foreground !text-xs !font-medium !px-2.5 !py-1.5 hover:!bg-muted',
                                    closeButton: '!text-muted-foreground hover:!text-foreground',
                                },
                            }}
                        />
                    </TooltipProvider>
                </SelectedProjectProvider>
            </DashboardApiProvider>
        </MotionConfig>
    );
}
