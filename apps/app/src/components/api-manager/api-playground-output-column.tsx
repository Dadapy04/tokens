import { Badge } from '@solana/design-system/badge';
import { CodeBlock } from '@solana/design-system/code-block';
import { Tab, TabList, TabPanel, Tabs } from '@solana/design-system/tabs';

import { CODE_BLOCK_CLASS_NAME, OUTPUT_CODE_MAX_HEIGHT_PX } from './api-playground-constants';
import type { ExecutionResult, OutputPanelId } from './api-playground-types';

export interface OutputPanelProps {
    activePanel: OutputPanelId;
    onActivePanelChange: (panel: OutputPanelId) => void;
    statusLabel: string;
    executeError: string | null;
    executionResult: ExecutionResult | null;
    codeSnippet: string;
    responseBody: string;
    exampleBody: string;
}

function OutputPanel({
    activePanel,
    onActivePanelChange,
    statusLabel,
    executeError,
    executionResult,
    codeSnippet,
    responseBody,
    exampleBody,
}: OutputPanelProps) {
    return (
        <Tabs
            size="md"
            bordered={false}
            fullWidth
            value={activePanel}
            onValueChange={value => onActivePanelChange(value as OutputPanelId)}
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <TabList className="w-max">
                    <Tab value="code">Code</Tab>
                    <Tab value="response">Response</Tab>
                    <Tab value="example">Example</Tab>
                </TabList>

                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            executionResult
                                ? executionResult.ok
                                    ? 'success'
                                    : 'danger'
                                : executeError
                                  ? 'danger'
                                  : 'default'
                        }
                        dot
                        className="font-mono"
                    >
                        {statusLabel}
                    </Badge>
                    {executionResult ? (
                        <Badge variant="default" className="font-mono">
                            {executionResult.durationMs}ms
                        </Badge>
                    ) : null}
                </div>
            </div>

            <TabPanel value="code" className="pt-0">
                <CodeBlock
                    ariaLabel="API playground code"
                    code={codeSnippet}
                    language="javascript"
                    maxHeight={OUTPUT_CODE_MAX_HEIGHT_PX}
                    className={CODE_BLOCK_CLASS_NAME}
                />
            </TabPanel>
            <TabPanel value="response" className="pt-0">
                <CodeBlock
                    ariaLabel="API playground response"
                    code={responseBody}
                    language="json"
                    maxHeight={OUTPUT_CODE_MAX_HEIGHT_PX}
                    className={CODE_BLOCK_CLASS_NAME}
                />
            </TabPanel>
            <TabPanel value="example" className="pt-0">
                <CodeBlock
                    ariaLabel="API playground example response"
                    code={exampleBody}
                    language="json"
                    maxHeight={OUTPUT_CODE_MAX_HEIGHT_PX}
                    className={CODE_BLOCK_CLASS_NAME}
                />
            </TabPanel>
        </Tabs>
    );
}

export function OutputColumn(props: OutputPanelProps) {
    return (
        <div className="min-h-0 border-t border-[rgba(28,28,29,0.1)] lg:border-t-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
            <div className="flex h-full min-h-0 flex-col px-6 py-6">
                <OutputPanel {...props} />
            </div>
        </div>
    );
}
