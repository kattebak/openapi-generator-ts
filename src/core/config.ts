/**
 * Generator configuration
 */

export interface CodegenConfig {
  /**
   * Generator name/type
   */
  generatorName: string;

  /**
   * Input OpenAPI spec file
   */
  inputSpec: string;

  /**
   * Output directory
   */
  outputDir: string;

  /**
   * Custom template directory
   */
  templateDir?: string;

  /**
   * Library variant to use
   */
  library?: string;

  /**
   * Package name for generated code
   */
  packageName?: string;

  /**
   * API package name
   */
  apiPackage?: string;

  /**
   * Model package name
   */
  modelPackage?: string;

  /**
   * Invoker package name
   */
  invokerPackage?: string;

  /**
   * Additional properties to pass to templates
   */
  additionalProperties?: Record<string, unknown>;

  /**
   * Global properties
   */
  globalProperties?: Record<string, string>;

  /**
   * Type mappings (OpenAPI type -> target type)
   */
  typeMappings?: Record<string, string>;

  /**
   * Import mappings (model name -> import path)
   */
  importMappings?: Record<string, string>;

  /**
   * Name mappings (OpenAPI name -> target name)
   */
  nameMappings?: Record<string, string>;

  /**
   * Reserved words that should not be used as names
   */
  reservedWordsMappings?: Record<string, string>;

  /**
   * Skip generating these files
   */
  skipFiles?: string[];

  /**
   * Only generate these files
   */
  files?: Record<string, string>;

  /**
   * Skip overwriting existing files
   */
  skipOverwrite?: boolean;

  /**
   * Only write files if content changed
   */
  minimalUpdate?: boolean;

  /**
   * Don't write files, just show what would be generated
   */
  dryRun?: boolean;

  /**
   * Generate models
   */
  generateModels?: boolean;

  /**
   * Generate APIs
   */
  generateApis?: boolean;

  /**
   * Generate supporting files
   */
  generateSupportingFiles?: boolean;

  /**
   * Validate spec before generation
   */
  validateSpec?: boolean;

  /**
   * Strict spec mode
   */
  strictSpec?: boolean;

  /**
   * Enable verbose output
   */
  verbose?: boolean;

  /**
   * Enable debug mode
   */
  debug?: boolean;
}

export interface SupportingFileConfig {
  /**
   * Template file name
   */
  templateFile: string;

  /**
   * Destination folder (relative to output dir)
   */
  folder: string;

  /**
   * Destination file name
   */
  destinationFilename: string;

  /**
   * Condition to check before generating
   */
  condition?: (config: CodegenConfig) => boolean;
}

export interface GeneratorMetadata {
  /**
   * Generator name
   */
  name: string;

  /**
   * Generator description
   */
  description?: string;

  /**
   * Generator type (client, server, documentation, etc.)
   */
  type: 'client' | 'server' | 'documentation' | 'config' | 'schema' | 'other';

  /**
   * Target language
   */
  language: string;

  /**
   * Available libraries/variants
   */
  libraries?: string[];

  /**
   * Default library
   */
  defaultLibrary?: string;

  /**
   * Embedded template directory name
   */
  embeddedTemplateDir: string;

  /**
   * File extension for models
   */
  modelFileExtension: string;

  /**
   * File extension for APIs
   */
  apiFileExtension: string;

  /**
   * Model template name
   */
  modelTemplateFile: string;

  /**
   * API template name
   */
  apiTemplateFile: string;

  /**
   * Supporting files to generate
   */
  supportingFiles: SupportingFileConfig[];

  /**
   * Reserved words in the target language
   */
  reservedWords: Set<string>;

  /**
   * Default type mappings
   */
  defaultTypeMappings: Record<string, string>;

  /**
   * Default import mappings
   */
  defaultImportMappings: Record<string, string>;
}

/**
 * Create default config with sensible defaults
 */
export function createDefaultConfig(
  overrides: Partial<CodegenConfig> = {}
): CodegenConfig {
  return {
    generatorName: 'typescript',
    inputSpec: '',
    outputDir: './generated',
    generateModels: true,
    generateApis: true,
    generateSupportingFiles: true,
    validateSpec: true,
    strictSpec: false,
    skipOverwrite: false,
    minimalUpdate: true,
    dryRun: false,
    verbose: false,
    debug: false,
    additionalProperties: {},
    globalProperties: {},
    typeMappings: {},
    importMappings: {},
    nameMappings: {},
    reservedWordsMappings: {},
    ...overrides,
  };
}
