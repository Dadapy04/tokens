'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { FooterBar } from './api-playground-footer-bar';
import { HeaderBar } from './api-playground-header-bar';
import { OutputColumn } from './api-playground-output-column';
import { RequestBuilderColumn } from './api-playground-request-builder-column';
import type { ApiPlaygroundEndpointConfig, ExecutionResult, OutputPanelId } from './api-playground-types';
import {
    buildFetchSnippet,
    buildInitialFieldValues,
    buildQueryString,
    getDefaultApiBaseUrl,
    getMissingRequiredFields,
    isRawApiKey,
    prettyJson,
    readResponseBody,
    resolvePathTemplate,
} from './api-playground-utils';

export { API_PLAYGROUND_OMIT_VALUE } from './api-playground-constants';
export type {
    ApiPlaygroundEndpointConfig,
    ApiPlaygroundFieldConfig,
    ApiPlaygroundFieldOption,
    ApiPlaygroundMethod,
} from './api-playground-types';

export interface ApiPlaygroundShellProps {
    apiKey: string;
    projectId: string;
    apiKeyId: string | null;
    hasActiveApiKey: boolean;
    endpoints: ApiPlaygroundEndpointConfig[];
    productName: string;
    activeEndpointId: string;
    onEndpointChange: (endpointId: string) => void;
}

export function ApiPlaygroundShell({
    apiKey,
    projectId,
    apiKeyId,
    hasActiveApiKey,
    endpoints,
    productName: _productName,
    activeEndpointId,
    onEndpointChange,
}: ApiPlaygroundShellProps) {
    const normalizedApiKey = apiKey.trim();
    const hasRawApiKey = isRawApiKey(normalizedApiKey);
    const canExecuteLive = hasRawApiKey || (hasActiveApiKey && Boolean(projectId) && Boolean(apiKeyId));
    const usesProjectKeyProxy = !hasRawApiKey && canExecuteLive;

    const activeEndpoint =
        endpoints.find(endpoint => endpoint.id === activeEndpointId) ?? (endpoints.length > 0 ? endpoints[0] : null);

    const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
        activeEndpoint ? buildInitialFieldValues(activeEndpoint) : {},
    );
    const [activePanel, setActivePanel] = useState<OutputPanelId>('code');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executeError, setExecuteError] = useState<string | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

    useEffect(() => {
        if (!activeEndpoint) return;
        setFieldValues(buildInitialFieldValues(activeEndpoint));
        setActivePanel('code');
        setExecutionResult(null);
        setExecuteError(null);
    }, [activeEndpoint]);

    const requestPath = useMemo(() => {
        if (!activeEndpoint) return '';
        const resolvedPath = resolvePathTemplate(activeEndpoint.path, fieldValues);
        const queryFields = activeEndpoint.queryFields ?? [];
        const queryString = buildQueryString(queryFields, fieldValues);
        return `${resolvedPath}${queryString}`;
    }, [activeEndpoint, fieldValues]);

    const apiBaseUrl = useMemo(() => getDefaultApiBaseUrl(), []);

    const codeSnippet = useMemo(() => {
        if (!activeEndpoint) return '';
        return buildFetchSnippet({ apiBaseUrl, endpoint: activeEndpoint, requestPath });
    }, [activeEndpoint, apiBaseUrl, requestPath]);

    const exampleBody = useMemo(() => {
        if (!activeEndpoint) return '{}';
        return prettyJson(activeEndpoint.expectedResponse ?? {});
    }, [activeEndpoint]);

    const responseBody = useMemo(() => {
        if (executionResult) return prettyJson(executionResult.body);
        if (executeError) return prettyJson({ error: executeError });
        return prettyJson({ message: 'Run request to inspect the live API output for this endpoint.' });
    }, [executionResult, executeError]);

    const panelContent = activePanel === 'code' ? codeSnippet : activePanel === 'response' ? responseBody : exampleBody;

    const statusLabel = executionResult
        ? `${executionResult.status} ${executionResult.statusText}`
        : executeError
          ? 'Request failed'
          : 'Ready';

    const updateFieldValue = useCallback((fieldKey: string, value: string | null) => {
        setFieldValues(current => ({ ...current, [fieldKey]: value ?? '' }));
    }, []);

    const handleReset = useCallback(() => {
        if (!activeEndpoint) return;
        setFieldValues(buildInitialFieldValues(activeEndpoint));
        setActivePanel('code');
        setExecutionResult(null);
        setExecuteError(null);
    }, [activeEndpoint]);

    const handleExecute = useCallback(async () => {
        if (!activeEndpoint) return;

        setExecuteError(null);
        setExecutionResult(null);

        if (!canExecuteLive) {
            setExecuteError('API key unavailable. Create an active API key to enable live testing.');
            setActivePanel('response');
            return;
        }

        const missingFields = getMissingRequiredFields(activeEndpoint, fieldValues);
        if (missingFields.length > 0) {
            setExecuteError(`Complete required fields: ${missingFields.join(', ')}`);
            setActivePanel('response');
            return;
        }

        const startedAt = performance.now();
        setIsExecuting(true);

        try {
            const headers: Record<string, string> = { accept: 'application/json' };
            if (hasRawApiKey) {
                headers['x-api-key'] = normalizedApiKey;
            } else if (apiKeyId) {
                headers['x-tokens-playground-project-id'] = projectId;
                headers['x-tokens-playground-api-key-id'] = apiKeyId;
            }

            const response = await fetch(requestPath, {
                method: activeEndpoint.method,
                headers,
            });

            const body = await readResponseBody(response);
            const durationMs = Math.max(0, Math.round(performance.now() - startedAt));

            setExecutionResult({
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                durationMs,
                body,
            });
            setActivePanel('response');
        } catch (error) {
            setExecuteError(error instanceof Error ? error.message : 'Request execution failed.');
            setActivePanel('response');
        } finally {
            setIsExecuting(false);
        }
    }, [activeEndpoint, apiKeyId, canExecuteLive, fieldValues, hasRawApiKey, normalizedApiKey, projectId, requestPath]);

    if (!activeEndpoint) return null;

    const pathFields = activeEndpoint.pathFields ?? [];
    const queryFields = activeEndpoint.queryFields ?? [];

    return (
        <div className="rounded-[12px] bg-gray-100/60 overflow-hidden p-0.5">
            <div className="bg-white dark:bg-zinc-950/30 border border-black/[0.15] rounded-lg shadow-sm overflow-hidden">
                <div className="relative flex w-full flex-col overflow-hidden">
                    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-[rgba(28,28,29,0.1)] lg:block" />

                    <HeaderBar
                        endpoints={endpoints}
                        activeEndpoint={activeEndpoint}
                        canExecuteLive={canExecuteLive}
                        usesProjectKeyProxy={usesProjectKeyProxy}
                        onEndpointChange={onEndpointChange}
                    />

                    <div className="flex min-h-0 flex-1 flex-col border-b border-[rgba(28,28,29,0.1)] lg:grid lg:grid-cols-2">
                        <RequestBuilderColumn
                            endpointId={activeEndpoint.id}
                            canExecuteLive={canExecuteLive}
                            usesProjectKeyProxy={usesProjectKeyProxy}
                            pathFields={pathFields}
                            queryFields={queryFields}
                            fieldValues={fieldValues}
                            onFieldValueChange={(fieldKey, nextValue) => updateFieldValue(fieldKey, nextValue)}
                        />

                        <OutputColumn
                            activePanel={activePanel}
                            onActivePanelChange={setActivePanel}
                            statusLabel={statusLabel}
                            executeError={executeError}
                            executionResult={executionResult}
                            codeSnippet={codeSnippet}
                            responseBody={responseBody}
                            exampleBody={exampleBody}
                        />
                    </div>

                    <FooterBar
                        canExecuteLive={canExecuteLive}
                        isExecuting={isExecuting}
                        onExecute={handleExecute}
                        onReset={handleReset}
                        activePanel={activePanel}
                        panelContent={panelContent}
                    />
                </div>
            </div>
        </div>
    );
}
