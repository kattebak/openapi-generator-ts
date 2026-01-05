/**
 * Core type definitions for the OpenAPI Generator
 */

export interface GeneratorOptions {
	inputSpec: string;
	outputDir: string;
	generatorName: string;
	templateDir?: string;
	library?: string;
	additionalProperties?: Record<string, unknown>;
	skipOverwrite?: boolean;
	minimalUpdate?: boolean;
	dryRun?: boolean;
}

export interface TemplateManagerOptions {
	minimalUpdate: boolean;
	skipOverwrite: boolean;
	dryRun: boolean;
}

export interface WriteOptions {
	skipOverwrite?: boolean;
	minimalUpdate?: boolean;
}

export interface TemplateData {
	[key: string]: unknown;
}

export type CompiledTemplate = (data: TemplateData) => string;

export interface TemplatePathLocator {
	getFullTemplatePath(name: string): string | null;
}

export interface TemplatingEngine {
	compile(source: string): CompiledTemplate;
	registerHelper(name: string, fn: (...args: unknown[]) => string): void;
	registerPartial(name: string, source: string): void;
}

export interface SupportingFile {
	templateFile: string;
	folder: string;
	destinationFilename: string;
}

export interface GeneratedFile {
	path: string;
	content: string;
	skipped: boolean;
	reason?: string;
}
