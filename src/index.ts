/**
 * @kattebak/openapi-generator-ts
 *
 * OpenAPI Generator - Generate code from OpenAPI specifications
 */

export type {
	CodegenConfig,
	GeneratorMetadata,
	SupportingFileConfig,
} from "./core/config.js";
// Core exports
export * from "./core/index.js";
// Re-export commonly used types
export type {
	CompiledTemplate,
	GeneratedFile,
	GeneratorOptions,
	TemplateData,
	TemplateManagerOptions,
} from "./core/types.js";
// Generator exports
export * from "./generators/index.js";
// Model exports
export * from "./models/index.js";
// Parser exports
export * from "./parser/index.js";
export type {
	ParsedSpec,
	ParseOptions,
} from "./parser/openapi-parser.js";
// Template exports
export * from "./template/index.js";
