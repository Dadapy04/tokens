export type PreviewPrimitive = string | number | boolean | null;

export type PreviewValue =
    | PreviewPrimitive
    | readonly PreviewValue[]
    | {
          readonly [key: string]: PreviewValue | undefined;
      };

export type PreviewArgs = Readonly<Record<string, PreviewValue | undefined>>;

export interface PreviewEnv {
    pathname: string;
    searchParams: Readonly<Record<string, PreviewValue | undefined>>;
}

export interface PreviewScenario<TArgs extends PreviewArgs = PreviewArgs> {
    id: string;
    name: string;
    args: TArgs;
    env: PreviewEnv;
}

export interface PreviewControlOption {
    label: string;
    value: PreviewPrimitive;
}

export interface PreviewControl {
    name: string;
    label?: string;
    description?: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    defaultValue?: PreviewValue;
    options?: readonly PreviewControlOption[];
}

export type PreviewModuleMocks = Readonly<Record<string, string>>;

export interface ComponentPreviewDefinition<TArgs extends PreviewArgs = PreviewArgs> {
    component: string;
    componentExport: string;
    scenarios: readonly PreviewScenario<TArgs>[];
    controls: readonly PreviewControl[];
    moduleMocks: PreviewModuleMocks;
}

export function defineComponentPreview<const TArgs extends PreviewArgs>(
    preview: ComponentPreviewDefinition<TArgs>,
): ComponentPreviewDefinition<TArgs> {
    return preview;
}
