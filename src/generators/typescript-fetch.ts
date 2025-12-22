/**
 * TypeScript Fetch Generator
 * Generates TypeScript client code using the Fetch API
 */
import type { GeneratorMetadata, CodegenConfig } from '../core/config.js';

/**
 * TypeScript reserved words
 */
const TYPESCRIPT_RESERVED_WORDS = new Set([
  'abstract',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
  'type',
]);

/**
 * TypeScript type mappings
 */
const TYPESCRIPT_TYPE_MAPPINGS: Record<string, string> = {
  // Primitives
  integer: 'number',
  long: 'number',
  float: 'number',
  double: 'number',
  number: 'number',
  decimal: 'number',
  string: 'string',
  boolean: 'boolean',

  // Date/Time
  date: 'string',
  'date-time': 'string',
  DateTime: 'Date',
  Date: 'Date',

  // Binary
  binary: 'Blob',
  byte: 'string',
  ByteArray: 'string',
  file: 'File',
  File: 'File',

  // Special
  uuid: 'string',
  uri: 'string',
  URI: 'string',
  email: 'string',
  password: 'string',

  // Collections
  array: 'Array',
  list: 'Array',
  set: 'Set',
  map: 'Record',
  object: 'object',

  // Any
  AnyType: 'any',
};

/**
 * TypeScript import mappings
 */
const TYPESCRIPT_IMPORT_MAPPINGS: Record<string, string> = {};

/**
 * Create TypeScript Fetch generator metadata
 */
export function createTypescriptFetchMetadata(): GeneratorMetadata {
  return {
    name: 'typescript-fetch',
    description: 'Generates TypeScript client code using the Fetch API',
    type: 'client',
    language: 'TypeScript',
    libraries: ['default', 'es6-fetch'],
    defaultLibrary: 'default',
    embeddedTemplateDir: 'typescript-fetch',
    modelFileExtension: '.ts',
    apiFileExtension: '.ts',
    modelTemplateFile: 'modelGeneric.mustache',
    apiTemplateFile: 'apis.mustache',
    supportingFiles: [
      {
        templateFile: 'index.mustache',
        folder: '',
        destinationFilename: 'index.ts',
      },
      {
        templateFile: 'runtime.mustache',
        folder: '',
        destinationFilename: 'runtime.ts',
      },
      {
        templateFile: 'configuration.mustache',
        folder: '',
        destinationFilename: 'configuration.ts',
      },
      {
        templateFile: 'package.mustache',
        folder: '',
        destinationFilename: 'package.json',
      },
      {
        templateFile: 'tsconfig.mustache',
        folder: '',
        destinationFilename: 'tsconfig.json',
      },
      {
        templateFile: 'README.mustache',
        folder: '',
        destinationFilename: 'README.md',
      },
      {
        templateFile: 'apis.mustache',
        folder: 'apis',
        destinationFilename: 'index.ts',
      },
      {
        templateFile: 'models.mustache',
        folder: 'models',
        destinationFilename: 'index.ts',
      },
    ],
    reservedWords: TYPESCRIPT_RESERVED_WORDS,
    defaultTypeMappings: TYPESCRIPT_TYPE_MAPPINGS,
    defaultImportMappings: TYPESCRIPT_IMPORT_MAPPINGS,
  };
}

/**
 * Get TypeScript-specific additional properties
 */
export function getTypescriptAdditionalProperties(
  config: CodegenConfig
): Record<string, unknown> {
  return {
    supportsES6: true,
    useSingleRequestParameter: config.additionalProperties?.useSingleRequestParameter ?? true,
    withInterfaces: config.additionalProperties?.withInterfaces ?? true,
    npmName: config.additionalProperties?.npmName ?? config.packageName,
    npmVersion: config.additionalProperties?.npmVersion ?? '1.0.0',
    snapshot: false,
    ...config.additionalProperties,
  };
}
