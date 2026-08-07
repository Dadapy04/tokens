'use client';

import { useEffect, useRef } from 'react';

import DashboardTabs from '@/app/(dashboard)/_components/dashboard-tabs';
import SubNav from '@/components/global/sub-nav';
import { ProjectApiKeysProvider } from '@/contexts/project-api-keys';
import { useDashboardMutation } from '@/hooks/use-dashboard-api';
import { useSelectedProject } from '@/hooks/use-selected-project';

export function DashboardUi(): React.JSX.Element {
    const getOrCreatePersonalProject = useDashboardMutation<string>('projectsGetOrCreatePersonalProject');

    const { selectedProjectId, setSelectedProjectId, userProjectsInfo } = useSelectedProject();
    const projectId: string | null =
        selectedProjectId && userProjectsInfo?.projects.some(p => p._id === selectedProjectId)
            ? selectedProjectId
            : null;

    const isEnsuringProjectRef = useRef(false);

    useEffect(() => {
        if (userProjectsInfo === null) return;
        if (userProjectsInfo.projects.length > 0) return;
        if (isEnsuringProjectRef.current) return;
        isEnsuringProjectRef.current = true;

        void (async () => {
            try {
                const id = await getOrCreatePersonalProject({});
                setSelectedProjectId(String(id));
            } catch (error) {
                console.error('Failed to create personal project:', error);
            } finally {
                isEnsuringProjectRef.current = false;
            }
        })();
    }, [getOrCreatePersonalProject, setSelectedProjectId, userProjectsInfo]);

    return (
        <ProjectApiKeysProvider projectId={projectId}>
            <SubNav />
            <DashboardTabs />
        </ProjectApiKeysProvider>
    );
}
