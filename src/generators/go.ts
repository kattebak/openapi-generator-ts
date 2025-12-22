/**
 * Go Generator
 * Generates Go client code
 */
import type { GeneratorMetadata, CodegenConfig } from '../core/config.js';

/**
 * Go reserved words
 * From https://golang.org/ref/spec#Keywords
 * Plus common data types and error
 */
const GO_RESERVED_WORDS = new Set([
  // Data types
  'string',
  'bool',
  'uint',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'int',
  'int8',
  'int16',
  'int32',
  'int64',
  'float32',
  'float64',
  'complex64',
  'complex128',
  'rune',
  'byte',
  'uintptr',

  // Keywords
  'break',
  'default',
  'func',
  'interface',
  'select',
  'case',
  'defer',
  'go',
  'map',
  'struct',
  'chan',
  'else',
  'goto',
  'package',
  'switch',
  'const',
  'fallthrough',
  'if',
  'range',
  'type',
  'continue',
  'for',
  'import',
  'return',
  'var',
  'error',
  'nil',
]);

/**
 * Go type mappings
 */
const GO_TYPE_MAPPINGS: Record<string, string> = {
  // Primitives
  integer: 'int32',
  long: 'int64',
  number: 'float32',
  float: 'float32',
  double: 'float64',
  decimal: 'float64',
  boolean: 'bool',
  string: 'string',

  // Special strings
  UUID: 'string',
  URI: 'string',
  date: 'string',
  password: 'string',

  // DateTime
  DateTime: 'time.Time',

  // File/Binary
  File: '*os.File',
  file: '*os.File',
  binary: '*os.File',
  ByteArray: 'string',

  // Null
  null: 'nil',

  // Object/Any
  object: 'map[string]interface{}',
  AnyType: 'interface{}',
};

/**
 * Go import mappings
 */
const GO_IMPORT_MAPPINGS: Record<string, string> = {
  'time.Time': 'time',
  '*os.File': 'os',
};

/**
 * Create Go generator metadata
 */
export function createGoMetadata(): GeneratorMetadata {
  return {
    name: 'go',
    description: 'Generates Go client code',
    type: 'client',
    language: 'Go',
    libraries: ['default'],
    defaultLibrary: 'default',
    embeddedTemplateDir: 'go',
    modelFileExtension: '.go',
    apiFileExtension: '.go',
    modelTemplateFile: 'model.mustache',
    apiTemplateFile: 'api.mustache',
    supportingFiles: [
      {
        templateFile: 'README.mustache',
        folder: '',
        destinationFilename: 'README.md',
      },
      {
        templateFile: 'gitignore.mustache',
        folder: '',
        destinationFilename: '.gitignore',
      },
      {
        templateFile: 'git_push.sh.mustache',
        folder: '',
        destinationFilename: 'git_push.sh',
      },
      {
        templateFile: 'configuration.mustache',
        folder: '',
        destinationFilename: 'configuration.go',
      },
      {
        templateFile: 'client.mustache',
        folder: '',
        destinationFilename: 'client.go',
      },
      {
        templateFile: 'response.mustache',
        folder: '',
        destinationFilename: 'response.go',
      },
      {
        templateFile: 'utils.mustache',
        folder: '',
        destinationFilename: 'utils.go',
      },
      {
        templateFile: 'go.mod.mustache',
        folder: '',
        destinationFilename: 'go.mod',
      },
      {
        templateFile: 'go.sum.mustache',
        folder: '',
        destinationFilename: 'go.sum',
      },
      {
        templateFile: '.travis.yml',
        folder: '',
        destinationFilename: '.travis.yml',
      },
    ],
    reservedWords: GO_RESERVED_WORDS,
    defaultTypeMappings: GO_TYPE_MAPPINGS,
    defaultImportMappings: GO_IMPORT_MAPPINGS,
  };
}

/**
 * Get Go-specific additional properties
 */
export function getGoAdditionalProperties(config: CodegenConfig): Record<string, unknown> {
  return {
    packageName: config.packageName ?? 'openapi',
    packageVersion: config.additionalProperties?.packageVersion ?? '1.0.0',
    hideGenerationTimestamp: config.additionalProperties?.hideGenerationTimestamp ?? true,
    withGoMod: config.additionalProperties?.withGoMod ?? true,
    withXml: config.additionalProperties?.withXml ?? false,
    withAWSV4Signature: config.additionalProperties?.withAWSV4Signature ?? false,
    enumClassPrefix: config.additionalProperties?.enumClassPrefix ?? false,
    structPrefix: config.additionalProperties?.structPrefix ?? false,
    generateInterfaces: config.additionalProperties?.generateInterfaces ?? false,
    useOneOfDiscriminatorLookup: config.additionalProperties?.useOneOfDiscriminatorLookup ?? false,
    generateMarshalJSON: config.additionalProperties?.generateMarshalJSON ?? true,
    generateUnmarshalJSON: config.additionalProperties?.generateUnmarshalJSON ?? true,
    useDefaultValuesForRequiredVars:
      config.additionalProperties?.useDefaultValuesForRequiredVars ?? false,
    goImportAlias: config.additionalProperties?.goImportAlias ?? 'openapiclient',
    apiDocPath: 'docs/',
    modelDocPath: 'docs/',
    ...config.additionalProperties,
  };
}
