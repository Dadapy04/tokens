'use client';

import { Toaster } from 'sonner';
import { AdminApiProvider } from '@/hooks/use-admin-api';
import { TooltipProvider } from '@tokens/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AdminApiProvider>
            <TooltipProvider>
                {children}
                <Toaster position="bottom-center" />
            </TooltipProvider>
        </AdminApiProvider>
    );
}
