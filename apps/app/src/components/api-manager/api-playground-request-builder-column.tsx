import { Select, SelectItem } from '@solana/design-system/select';
import { TextInput } from '@solana/design-system/text-input';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { SELECT_ITEM_CLASS_NAME } from './api-playground-constants';
import type { ApiPlaygroundFieldConfig } from './api-playground-types';
import { buildFieldId } from './api-playground-utils';

function EmptyState({ children }: { children: string }) {
    return (
        <div className="rounded-[16px] border border-dashed border-[rgba(28,28,29,0.12)] bg-white/50 px-4 py-5 text-sm text-[rgba(28,28,29,0.54)]">
            {children}
        </div>
    );
}

interface ApiKeyStatusCardProps {
    canExecuteLive: boolean;
    usesProjectKeyProxy: boolean;
}

function ApiKeyStatusCard({ canExecuteLive, usesProjectKeyProxy }: ApiKeyStatusCardProps) {
    return (
        <div
            className={cn(
                'rounded-[14px] border px-4 py-3 text-sm',
                canExecuteLive
                    ? 'border-[rgba(28,28,29,0.12)] bg-white/60 text-[rgba(28,28,29,0.68)] dark:border-white/10 dark:bg-white/5 dark:text-white/70'
                    : 'border-[#c71f37]/15 bg-[#c71f37]/[0.04] text-[#8a1f2a] dark:border-[#c71f37]/30 dark:bg-[#c71f37]/[0.08] dark:text-[#ffb4bf]',
            )}
        >
            {canExecuteLive ? (
                <div>
                    <div className="font-medium text-[#1c1c1d] dark:text-white">
                        {usesProjectKeyProxy
                            ? 'Using this project’s active API key.'
                            : 'Using current project API key (hidden).'}
                    </div>
                    <div className="mt-1 text-[13px]">
                        {usesProjectKeyProxy
                            ? 'Live requests run through the dashboard proxy; snippets still show public x-api-key usage.'
                            : 'Requests send your key automatically via the x-api-key header.'}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="font-medium">API key unavailable.</div>
                    <div className="mt-1 text-[13px] opacity-90">
                        Create an active API key to enable live testing in this browser.
                    </div>
                </div>
            )}
        </div>
    );
}

interface ParametersSectionProps {
    title: string;
    emptyStateText: string;
    isEmpty: boolean;
    children: ReactNode;
}

function ParametersSection({ title, emptyStateText, isEmpty, children }: ParametersSectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-[18px] leading-6 font-medium text-[#1c1c1d] dark:text-white">{title}</h2>
            {isEmpty ? <EmptyState>{emptyStateText}</EmptyState> : children}
        </section>
    );
}

interface RequestFieldProps {
    endpointId: string;
    field: ApiPlaygroundFieldConfig;
    value: string;
    onValueChange: (fieldKey: string, nextValue: string | null) => void;
}

function RequestField({ endpointId, field, value, onValueChange }: RequestFieldProps) {
    if (field.kind === 'select') {
        return (
            <Select
                size="lg"
                label={field.label}
                placeholder={field.placeholder ?? 'Select value'}
                required={field.required}
                value={value.trim() || null}
                onValueChange={nextValue => onValueChange(field.key, nextValue)}
            >
                {(field.options ?? []).map(option => (
                    <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CLASS_NAME}>
                        {option.label}
                    </SelectItem>
                ))}
            </Select>
        );
    }

    return (
        <TextInput
            id={buildFieldId(endpointId, field.key)}
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            size="lg"
            type={field.inputType ?? 'text'}
            value={value}
            onChange={event => onValueChange(field.key, event.currentTarget.value)}
        />
    );
}

export interface RequestBuilderColumnProps {
    endpointId: string;
    canExecuteLive: boolean;
    usesProjectKeyProxy: boolean;
    pathFields: ApiPlaygroundFieldConfig[];
    queryFields: ApiPlaygroundFieldConfig[];
    fieldValues: Record<string, string>;
    onFieldValueChange: (fieldKey: string, nextValue: string | null) => void;
}

export function RequestBuilderColumn({
    endpointId,
    canExecuteLive,
    usesProjectKeyProxy,
    pathFields,
    queryFields,
    fieldValues,
    onFieldValueChange,
}: RequestBuilderColumnProps) {
    return (
        <div className="min-h-0 lg:block">
            <div className="flex h-full min-h-0 flex-col px-6 py-6">
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto lg:pr-2">
                    <ApiKeyStatusCard canExecuteLive={canExecuteLive} usesProjectKeyProxy={usesProjectKeyProxy} />

                    <ParametersSection
                        title="Path parameters"
                        emptyStateText="This endpoint does not require path parameters."
                        isEmpty={pathFields.length === 0}
                    >
                        <div className="space-y-4">
                            {pathFields.map(field => (
                                <RequestField
                                    key={field.key}
                                    endpointId={endpointId}
                                    field={field}
                                    value={fieldValues[field.key] ?? ''}
                                    onValueChange={onFieldValueChange}
                                />
                            ))}
                        </div>
                    </ParametersSection>

                    <ParametersSection
                        title="Query parameters"
                        emptyStateText="This endpoint does not require query parameters."
                        isEmpty={queryFields.length === 0}
                    >
                        <div className="space-y-4">
                            {queryFields.map(field => (
                                <RequestField
                                    key={field.key}
                                    endpointId={endpointId}
                                    field={field}
                                    value={fieldValues[field.key] ?? ''}
                                    onValueChange={onFieldValueChange}
                                />
                            ))}
                        </div>
                    </ParametersSection>
                </div>
            </div>
        </div>
    );
}
