export type ApiPlaygroundMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiPlaygroundFieldOption {
    label: string;
    value: string;
}

export interface ApiPlaygroundFieldConfig {
    key: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    kind?: 'text' | 'select';
    options?: ApiPlaygroundFieldOption[];
    required?: boolean;
    inputType?: 'text' | 'number';
}

export interface ApiPlaygroundEndpointConfig {
    id: string;
    title: string;
    method: ApiPlaygroundMethod;
    path: string;
    pathFields?: ApiPlaygroundFieldConfig[];
    queryFields?: ApiPlaygroundFieldConfig[];
    expectedResponse?: unknown;
}

export interface ExecutionResult {
    ok: boolean;
    status: number;
    statusText: string;
    durationMs: number;
    body: unknown;
}

export type OutputPanelId = 'code' | 'response' | 'example';
