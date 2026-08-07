import { Play, RotateCcw } from 'lucide-react';

import { Button } from '@solana/design-system/button';
import { CopyButton } from '@solana/design-system/copy-button';

import type { OutputPanelId } from './api-playground-types';

export interface FooterBarProps {
    canExecuteLive: boolean;
    isExecuting: boolean;
    onExecute: () => void;
    onReset: () => void;
    activePanel: OutputPanelId;
    panelContent: string;
}

export function FooterBar({
    canExecuteLive,
    isExecuting,
    onExecute,
    onReset,
    activePanel,
    panelContent,
}: FooterBarProps) {
    return (
        <div className="grid shrink-0 lg:grid-cols-2">
            <div className="flex flex-wrap items-center gap-3 px-6 py-5">
                <Button
                    type="button"
                    onClick={onExecute}
                    disabled={!canExecuteLive}
                    loading={isExecuting}
                    variant="primary"
                    size="md"
                    iconLeft={<Play className="size-4" />}
                    className="max-sm:flex-1"
                >
                    Run request
                </Button>
                <Button
                    type="button"
                    onClick={onReset}
                    variant="secondary"
                    size="md"
                    iconLeft={<RotateCcw className="size-4" />}
                >
                    Reset
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(28,28,29,0.1)] px-6 py-5 lg:border-t-0">
                <CopyButton
                    value={panelContent}
                    variant="inline"
                    size="md"
                    label={
                        activePanel === 'code'
                            ? 'Copy code'
                            : activePanel === 'response'
                              ? 'Copy response'
                              : 'Copy example'
                    }
                    className="max-sm:flex-1"
                />
            </div>
        </div>
    );
}
