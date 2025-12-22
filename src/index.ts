/**
 * @kattebak/openapi-generator-ts
 *
 * OpenAPI Generator - Generate code from OpenAPI specifications
 */

// Core exports
export * from './core/index.js';

// Parser exports
export * from './parser/index.js';

// Template exports
export * from './template/index.js';

// Model exports
export * from './models/index.js';

// Generator exports
export * from './generators/index.js';

// Re-export commonly used types
export type {
  GeneratorOptions,
  TemplateManagerOptions,
  TemplateData,
  CompiledTemplate,
  GeneratedFile,
} from './core/types.js';

export type {
  CodegenConfig,
  GeneratorMetadata,
  SupportingFileConfig,
} from './core/config.js';

export type {
  ParseOptions,
  ParsedSpec,
} from './parser/openapi-parser.js';
