import { cn } from '../../lib/utils';

/**
 * Skeleton component for displaying loading placeholders.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animate-pulse rounded-md bg-muted motion-reduce:animate-none', className)} {...props} />;
}

export { Skeleton };
