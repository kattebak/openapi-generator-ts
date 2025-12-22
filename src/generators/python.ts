/**
 * Python Generator
 * Generates Python client code using urllib3, asyncio, or httpx
 */
import type { GeneratorMetadata, CodegenConfig } from '../core/config.js';

/**
 * Python reserved words
 * From https://docs.python.org/3/reference/lexical_analysis.html#keywords
 * Plus pydantic and API method local variables
 */
const PYTHON_RESERVED_WORDS = new Set([
  // pydantic
  'field',
  // local variable name used in API methods (endpoints)
  'all_params',
  'resource_path',
  'path_params',
  'query_params',
  'header_params',
  'form_params',
  'local_var_files',
  'body_params',
  'auth_settings',
  // @property
  'property',
  // typing keywords
  'schema',
  'base64',
  'json',
  'date',
  'float',
  // python reserved words
  'and',
  'del',
  'from',
  'not',
  'while',
  'as',
  'elif',
  'global',
  'or',
  'with',
  'assert',
  'else',
  'if',
  'pass',
  'yield',
  'break',
  'except',
  'import',
  'print',
  'class',
  'exec',
  'in',
  'raise',
  'continue',
  'finally',
  'is',
  'return',
  'def',
  'for',
  'lambda',
  'try',
  'self',
  'nonlocal',
  'None',
  'True',
  'False',
  'async',
  'await',
]);

/**
 * Python type mappings
 */
const PYTHON_TYPE_MAPPINGS: Record<string, string> = {
  // Primitives
  integer: 'int',
  long: 'int',
  float: 'float',
  double: 'float',
  number: 'float',
  string: 'str',
  boolean: 'bool',

  // Date/Time
  date: 'date',
  DateTime: 'datetime',
  'date-time': 'datetime',

  // Binary/File
  binary: 'bytearray',
  byte: 'str',
  ByteArray: 'bytearray',
  file: 'bytearray',
  File: 'file',

  // Special
  uuid: 'str',
  UUID: 'str',
  uri: 'str',
  URI: 'str',
  email: 'str',
  password: 'str',

  // Collections
  array: 'List',
  list: 'List',
  set: 'List',
  map: 'Dict',
  object: 'object',

  // Any/Null
  AnyType: 'object',
  null: 'None',

  // Decimal
  decimal: 'Decimal',
};

/**
 * Python import mappings
 */
const PYTHON_IMPORT_MAPPINGS: Record<string, string> = {
  datetime: 'datetime',
  date: 'datetime',
  Decimal: 'decimal',
};

/**
 * Create Python generator metadata
 */
export function createPythonMetadata(): GeneratorMetadata {
  return {
    name: 'python',
    description: 'Generates Python client code',
    type: 'client',
    language: 'Python',
    libraries: ['urllib3', 'asyncio', 'httpx'],
    defaultLibrary: 'urllib3',
    embeddedTemplateDir: 'python',
    modelFileExtension: '.py',
    apiFileExtension: '.py',
    modelTemplateFile: 'model.mustache',
    apiTemplateFile: 'api.mustache',
    supportingFiles: [
      {
        templateFile: '__init__package.mustache',
        folder: '{{packageName}}',
        destinationFilename: '__init__.py',
      },
      {
        templateFile: '__init__model.mustache',
        folder: '{{packageName}}/models',
        destinationFilename: '__init__.py',
      },
      {
        templateFile: '__init__api.mustache',
        folder: '{{packageName}}/api',
        destinationFilename: '__init__.py',
      },
      {
        templateFile: 'api_client.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'api_client.py',
      },
      {
        templateFile: 'api_response.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'api_response.py',
      },
      {
        templateFile: 'configuration.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'configuration.py',
      },
      {
        templateFile: 'exceptions.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'exceptions.py',
      },
      {
        templateFile: 'rest.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'rest.py',
      },
      {
        templateFile: 'requirements.mustache',
        folder: '',
        destinationFilename: 'requirements.txt',
      },
      {
        templateFile: 'test-requirements.mustache',
        folder: '',
        destinationFilename: 'test-requirements.txt',
      },
      {
        templateFile: 'setup.mustache',
        folder: '',
        destinationFilename: 'setup.py',
      },
      {
        templateFile: 'pyproject.mustache',
        folder: '',
        destinationFilename: 'pyproject.toml',
      },
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
        templateFile: 'py.typed.mustache',
        folder: '{{packageName}}',
        destinationFilename: 'py.typed',
      },
    ],
    reservedWords: PYTHON_RESERVED_WORDS,
    defaultTypeMappings: PYTHON_TYPE_MAPPINGS,
    defaultImportMappings: PYTHON_IMPORT_MAPPINGS,
  };
}

/**
 * Get Python-specific additional properties
 */
export function getPythonAdditionalProperties(
  config: CodegenConfig
): Record<string, unknown> {
  return {
    packageName: config.packageName ?? 'openapi_client',
    packageVersion: config.additionalProperties?.packageVersion ?? '1.0.0',
    projectName:
      config.additionalProperties?.projectName ??
      (config.packageName ?? 'openapi_client').replace(/_/g, '-'),
    packageUrl: config.additionalProperties?.packageUrl,
    hideGenerationTimestamp:
      config.additionalProperties?.hideGenerationTimestamp ?? true,
    recursionLimit: config.additionalProperties?.recursionLimit,
    datetimeFormat:
      config.additionalProperties?.datetimeFormat ?? '%Y-%m-%dT%H:%M:%S.%f%z',
    dateFormat: config.additionalProperties?.dateFormat ?? '%Y-%m-%d',
    useOneOfDiscriminatorLookup:
      config.additionalProperties?.useOneOfDiscriminatorLookup ?? false,
    mapNumberTo:
      config.additionalProperties?.mapNumberTo ?? 'Union[StrictFloat, StrictInt]',
    ...config.additionalProperties,
  };
}
