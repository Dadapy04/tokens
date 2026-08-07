'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';

import { useDashboardQuery } from '@/hooks/use-dashboard-api';
import type { ProjectDoc, ProjectRole } from '@/lib/dashboard-types';

interface ProjectInfo {
    _id: string;
    name: string;
    tier?: string;
    description?: string;
}

interface UserProjectsInfo {
    projects: ProjectInfo[];
    defaultProject?: ProjectInfo;
}

const STORAGE_KEY = 'selectedProjectId';

function safeReadSelectedProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw && raw.trim().length > 0 ? raw : null;
}

function safeWriteSelectedProjectId(value: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, value);
}

interface SelectedProjectContextValue {
    selectedProjectId: string;
    setSelectedProjectId: (projectId: string) => void;
    userProjectsInfo: UserProjectsInfo | null;
}

const SelectedProjectContext = React.createContext<SelectedProjectContextValue | null>(null);

export function SelectedProjectProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();
    const isAuthenticated = Boolean(isLoaded && isSignedIn);
    const { data: rows } = useDashboardQuery<Array<{ project: ProjectDoc; role: ProjectRole }>>(
        'projectsListMine',
        isAuthenticated ? {} : 'skip',
    );
    const [selectedProjectId, setSelectedProjectIdState] = React.useState<string>('');

    const userProjectsInfo: UserProjectsInfo | null = React.useMemo(() => {
        if (rows === undefined) return null;
        const projects: ProjectInfo[] = rows.map(row => {
            const project = row.project as unknown as {
                _id: unknown;
                name: string;
                tier?: string;
                description?: string;
            };
            return {
                _id: String(project._id),
                name: project.name,
                ...(project.tier !== undefined ? { tier: project.tier } : {}),
                ...(project.description !== undefined ? { description: project.description } : {}),
            };
        });

        const defaultProject = projects[0];
        return { projects, ...(defaultProject ? { defaultProject } : {}) };
    }, [rows]);

    React.useEffect(() => {
        if (!isAuthenticated) {
            if (selectedProjectId !== '') setSelectedProjectIdState('');
            return;
        }
        if (userProjectsInfo === null) return;

        const projects = userProjectsInfo.projects;
        if (projects.length === 0) {
            if (selectedProjectId !== '') setSelectedProjectIdState('');
            return;
        }

        const isCurrentValid = selectedProjectId ? projects.some(p => p._id === selectedProjectId) : false;
        if (isCurrentValid) {
            safeWriteSelectedProjectId(selectedProjectId);
            return;
        }

        const stored = safeReadSelectedProjectId();
        const isStoredValid = stored ? projects.some(p => p._id === stored) : false;

        const next = isStoredValid ? stored! : (userProjectsInfo.defaultProject?._id ?? projects[0]!._id);
        if (next === selectedProjectId) return;

        setSelectedProjectIdState(next);
        safeWriteSelectedProjectId(next);
    }, [isAuthenticated, userProjectsInfo, selectedProjectId]);

    const setSelectedProjectId = React.useCallback((projectId: string) => {
        setSelectedProjectIdState(projectId);
        safeWriteSelectedProjectId(projectId);
    }, []);

    const value = React.useMemo<SelectedProjectContextValue>(
        () => ({ selectedProjectId, setSelectedProjectId, userProjectsInfo }),
        [selectedProjectId, setSelectedProjectId, userProjectsInfo],
    );

    return <SelectedProjectContext.Provider value={value}>{children}</SelectedProjectContext.Provider>;
}

export function useSelectedProject(): SelectedProjectContextValue {
    const ctx = React.useContext(SelectedProjectContext);
    if (!ctx) throw new Error('useSelectedProject must be used within SelectedProjectProvider');
    return ctx;
}
