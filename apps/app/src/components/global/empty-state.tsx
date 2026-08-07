import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
    iconClassName?: string;
    titleClassName?: string;
    subtitleClassName?: string;
}

export const EmptyState = ({
    icon,
    title,
    subtitle,
    className,
    iconClassName,
    titleClassName,
    subtitleClassName,
}: EmptyStateProps) => {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center py-8 text-muted-foreground',
                className,
            )}
        >
            <div className={cn('mx-auto opacity-50', iconClassName)}>{icon}</div>
            <p className={cn('font-medium text-lg text-text-extra-high', titleClassName)}>{title}</p>
            {subtitle && <p className={cn('text-sm mt-1 text-muted-foreground', subtitleClassName)}>{subtitle}</p>}
        </div>
    );
};
