'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { ApiList } from './api-list';
import { useProjectApiKeys } from '@/contexts/project-api-keys';
import { TabNavigation, type TabConfig } from '@/components/global/tab-navigation';
import { Skeleton } from '@tokens/ui/skeleton';

function ApiTesterLoading() {
    return (
        <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
            <div className="bg-white border border-black/20 rounded-lg shadow-sm overflow-hidden p-6">
                <Skeleton className="h-[420px] w-full" />
            </div>
        </div>
    );
}

interface ApiTesterProps {
    apiKey: string;
    projectId: string;
    apiKeyId: string | null;
    hasActiveApiKey: boolean;
}

const ApiTester = dynamic<ApiTesterProps>(() => import('./api-tester').then(mod => mod.ApiTester), {
    ssr: false,
    loading: () => <ApiTesterLoading />,
});

type ToolTabId = 'api-keys' | 'api-tester';

const tabs: TabConfig<ToolTabId>[] = [
    { label: 'Keys', id: 'api-keys' },
    { label: 'Playground', id: 'api-tester' },
];

interface ToolTabsProps {
    projectId: string;
}

export function ToolTabs({ projectId }: ToolTabsProps) {
    const {
        currentApiKey: apiKeyValue,
        currentApiKeyId: apiKeyId,
        hasActiveApiKey,
    } = useProjectApiKeys();
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(0);

    const slideDirection = activeIndex > previousIndex ? 1 : -1;

    const handleTabClick = useCallback(
        (id: ToolTabId, index: number) => {
            setIsInitialLoad(false);
            setPreviousIndex(activeIndex);
            setActiveIndex(index);
        },
        [activeIndex],
    );

    const renderActiveContent = () => {
        const activeTab = tabs[activeIndex];
        const safeApiKeyValue = apiKeyValue ?? '';

        switch (activeTab.id) {
            case 'api-keys':
                return <ApiList projectId={projectId} />;
            case 'api-tester':
                return hasActiveApiKey ? (
                    <ApiTester
                        apiKey={safeApiKeyValue}
                        projectId={projectId}
                        apiKeyId={apiKeyId}
                        hasActiveApiKey={hasActiveApiKey}
                    />
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="text-muted-foreground mb-2">API Playground requires an active API key</div>
                            <div className="text-sm text-muted-foreground">
                                Please wait for your API key to be generated or create a new one.
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            <TabNavigation tabs={tabs} activeIndex={activeIndex} onTabClick={handleTabClick} />

            {/* Tab Content with Animations */}
            <div className="mt-6 relative px-2">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeIndex}
                        initial={
                            isInitialLoad
                                ? { opacity: 1, x: 0 }
                                : {
                                      opacity: 0,
                                      x: slideDirection > 0 ? 5 : -5,
                                  }
                        }
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        exit={{
                            opacity: 0,
                            x: slideDirection > 0 ? 5 : -5,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: 'easeOut',
                        }}
                    >
                        {renderActiveContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
