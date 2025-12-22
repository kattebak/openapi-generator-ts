/**
 * Default Generator
 * Main orchestrator for code generation
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { OpenAPIV3 } from 'openapi-types';
import type { CodegenConfig, GeneratorMetadata } from './config.js';
import type { GeneratedFile, TemplateData } from './types.js';
import {
  parseSpec,
  getSchemas,
  getPaths,
  getSecuritySchemes,
  getServers,
  getInfo,
  getTags,
  type ParsedSpec,
} from '../parser/openapi-parser.js';
import { SchemaTransformer } from '../parser/schema-transformer.js';
import { OperationTransformer } from '../parser/operation-transformer.js';
import { TemplateManager, type TemplateManagerConfig } from '../template/template-manager.js';
import type { CodegenModel, CodegenOperation } from '../models/index.js';

export interface GenerationResult {
  /**
   * Files that were generated
   */
  files: GeneratedFile[];

  /**
   * Models that were processed
   */
  models: Map<string, CodegenModel>;

  /**
   * Operations grouped by tag
   */
  operations: Map<string, CodegenOperation[]>;

  /**
   * Any warnings during generation
   */
  warnings: string[];

  /**
   * Any errors during generation
   */
  errors: string[];
}

export interface GeneratorContext {
  config: CodegenConfig;
  spec: ParsedSpec;
  models: Map<string, CodegenModel>;
  operations: Map<string, CodegenOperation[]>;
  templateManager: TemplateManager;
  globalProperties: Record<string, unknown>;
}

/**
 * Default code generator
 */
export class DefaultGenerator {
  private config: CodegenConfig;
  private metadata: GeneratorMetadata;
  private templateManager: TemplateManager | null = null;
  private schemaTransformer: SchemaTransformer;
  private operationTransformer: OperationTransformer;
  private embeddedTemplatesDir: string;

  constructor(config: CodegenConfig, metadata: GeneratorMetadata) {
    this.config = config;
    this.metadata = metadata;

    // Initialize transformers with type mappings
    const typeMappings = {
      ...metadata.defaultTypeMappings,
      ...config.typeMappings,
    };

    this.schemaTransformer = new SchemaTransformer({ typeMappings });
    this.operationTransformer = new OperationTransformer({ typeMappings });

    // Embedded templates directory - look in the original Java resources
    this.embeddedTemplatesDir = this.findEmbeddedTemplatesDir();
  }

  /**
   * Find the embedded templates directory
   */
  private findEmbeddedTemplatesDir(): string {
    // Check for templates in various locations
    const candidates = [
      // Relative to package
      path.join(__dirname, '../../templates'),
      // In node_modules
      path.join(process.cwd(), 'node_modules/@kattebak/openapi-generator-ts/templates'),
      // Development - Java resources
      path.join(process.cwd(), 'modules/openapi-generator/src/main/resources'),
      // Custom template dir
      this.config.templateDir,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    // Fallback to Java resources in workspace
    return path.join(process.cwd(), 'modules/openapi-generator/src/main/resources');
  }

  /**
   * Run the code generation process
   */
  async generate(): Promise<GenerationResult> {
    const result: GenerationResult = {
      files: [],
      models: new Map(),
      operations: new Map(),
      warnings: [],
      errors: [],
    };

    try {
      // Parse OpenAPI spec
      if (this.config.verbose) {
        console.log(`Parsing OpenAPI spec: ${this.config.inputSpec}`);
      }

      const spec = await parseSpec(this.config.inputSpec, {
        validate: this.config.validateSpec,
        dereference: true,
      });

      // Initialize template manager
      const templateConfig: TemplateManagerConfig = {
        options: {
          minimalUpdate: this.config.minimalUpdate ?? true,
          skipOverwrite: this.config.skipOverwrite ?? false,
          dryRun: this.config.dryRun ?? false,
        },
        locatorOptions: {
          customDir: this.config.templateDir,
          embeddedDir: this.embeddedTemplatesDir,
          generatorName: this.metadata.embeddedTemplateDir,
          library: this.config.library ?? this.metadata.defaultLibrary,
        },
      };

      this.templateManager = new TemplateManager(templateConfig);

      // Process schemas into models
      if (this.config.generateModels !== false) {
        if (this.config.verbose) {
          console.log('Processing schemas...');
        }

        const schemas = getSchemas(spec.document);
        result.models = this.schemaTransformer.transformSchemas(
          schemas as Record<string, OpenAPIV3.SchemaObject>
        );

        // Generate model files
        const modelFiles = await this.generateModels(result.models, spec);
        result.files.push(...modelFiles);
      }

      // Process operations
      if (this.config.generateApis !== false) {
        if (this.config.verbose) {
          console.log('Processing operations...');
        }

        const paths = getPaths(spec.document);
        const securitySchemes = getSecuritySchemes(spec.document);

        result.operations = this.operationTransformer.transformPaths(paths, securitySchemes);

        // Generate API files
        const apiFiles = await this.generateApis(result.operations, result.models, spec);
        result.files.push(...apiFiles);
      }

      // Generate supporting files
      if (this.config.generateSupportingFiles !== false) {
        if (this.config.verbose) {
          console.log('Generating supporting files...');
        }

        const supportingFiles = await this.generateSupportingFiles(
          result.models,
          result.operations,
          spec
        );
        result.files.push(...supportingFiles);
      }

      if (this.config.verbose) {
        console.log(`Generated ${result.files.length} files`);
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      throw error;
    }

    return result;
  }

  /**
   * Generate model files
   */
  private async generateModels(
    models: Map<string, CodegenModel>,
    spec: ParsedSpec
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    if (!this.templateManager) {
      throw new Error('Template manager not initialized');
    }

    const globalData = this.createGlobalTemplateData(spec);

    for (const [name, model] of models) {
      const templateData: TemplateData = {
        ...globalData,
        ...model,
        model,
        models: Array.from(models.values()),
        classname: model.classname,
        package: this.config.modelPackage ?? this.config.packageName,
      };

      try {
        const content = await this.templateManager.render(
          this.metadata.modelTemplateFile,
          templateData
        );

        const outputPath = path.join(
          this.config.outputDir,
          this.config.modelPackage?.replace(/\./g, '/') ?? 'models',
          `${model.classname}${this.metadata.modelFileExtension}`
        );

        const result = await this.templateManager.writeFile(outputPath, content);
        files.push(result);

        if (this.config.verbose && !result.skipped) {
          console.log(`  Generated: ${outputPath}`);
        }
      } catch (error) {
        if (this.config.verbose) {
          console.warn(`  Warning: Could not generate model ${name}: ${error}`);
        }
      }
    }

    return files;
  }

  /**
   * Generate API files
   */
  private async generateApis(
    operations: Map<string, CodegenOperation[]>,
    models: Map<string, CodegenModel>,
    spec: ParsedSpec
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    if (!this.templateManager) {
      throw new Error('Template manager not initialized');
    }

    const globalData = this.createGlobalTemplateData(spec);

    for (const [tag, ops] of operations) {
      const className = this.toApiClassName(tag);

      const templateData: TemplateData = {
        ...globalData,
        classname: className,
        baseName: tag,
        operations: { operation: ops },
        operation: ops,
        models: Array.from(models.values()),
        imports: this.collectImports(ops),
        package: this.config.apiPackage ?? this.config.packageName,
      };

      try {
        const content = await this.templateManager.render(
          this.metadata.apiTemplateFile,
          templateData
        );

        const outputPath = path.join(
          this.config.outputDir,
          this.config.apiPackage?.replace(/\./g, '/') ?? 'api',
          `${className}${this.metadata.apiFileExtension}`
        );

        const result = await this.templateManager.writeFile(outputPath, content);
        files.push(result);

        if (this.config.verbose && !result.skipped) {
          console.log(`  Generated: ${outputPath}`);
        }
      } catch (error) {
        if (this.config.verbose) {
          console.warn(`  Warning: Could not generate API ${tag}: ${error}`);
        }
      }
    }

    return files;
  }

  /**
   * Generate supporting files
   */
  private async generateSupportingFiles(
    models: Map<string, CodegenModel>,
    operations: Map<string, CodegenOperation[]>,
    spec: ParsedSpec
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    if (!this.templateManager) {
      throw new Error('Template manager not initialized');
    }

    const globalData = this.createGlobalTemplateData(spec);

    const templateData: TemplateData = {
      ...globalData,
      models: Array.from(models.values()),
      apis: Array.from(operations.entries()).map(([tag, ops]) => ({
        classname: this.toApiClassName(tag),
        baseName: tag,
        operations: ops,
      })),
      apiInfo: {
        apis: Array.from(operations.entries()).map(([tag, ops]) => ({
          classname: this.toApiClassName(tag),
          baseName: tag,
          operations: { operation: ops },
        })),
      },
    };

    for (const supportingFile of this.metadata.supportingFiles) {
      // Check condition
      if (supportingFile.condition && !supportingFile.condition(this.config)) {
        continue;
      }

      try {
        const content = await this.templateManager.render(
          supportingFile.templateFile,
          templateData
        );

        const outputPath = path.join(
          this.config.outputDir,
          supportingFile.folder,
          supportingFile.destinationFilename
        );

        const result = await this.templateManager.writeFile(outputPath, content);
        files.push(result);

        if (this.config.verbose && !result.skipped) {
          console.log(`  Generated: ${outputPath}`);
        }
      } catch (error) {
        // Supporting files are optional - don't fail if template not found
        if (this.config.debug) {
          console.warn(
            `  Could not generate supporting file ${supportingFile.templateFile}: ${error}`
          );
        }
      }
    }

    return files;
  }

  /**
   * Create global template data available to all templates
   */
  private createGlobalTemplateData(spec: ParsedSpec): TemplateData {
    const info = getInfo(spec.document);
    const servers = getServers(spec.document);
    const tags = getTags(spec.document);

    return {
      // OpenAPI info
      appName: info.title,
      appVersion: info.version,
      appDescription: info.description,
      infoUrl: info.termsOfService,
      infoEmail: info.contact?.email,
      licenseInfo: info.license?.name,
      licenseUrl: info.license?.url,

      // Servers
      servers,
      basePath: servers[0]?.url ?? '',

      // Tags
      tags,

      // Config
      packageName: this.config.packageName,
      apiPackage: this.config.apiPackage ?? this.config.packageName,
      modelPackage: this.config.modelPackage ?? this.config.packageName,
      invokerPackage: this.config.invokerPackage ?? this.config.packageName,

      // Generator info
      generatorClass: this.metadata.name,
      generatedDate: new Date().toISOString(),
      generatedYear: new Date().getFullYear(),

      // Additional properties
      ...this.config.additionalProperties,

      // Global properties
      ...this.config.globalProperties,

      // Lambda functions are registered in the template engine
      lambda: {},
    };
  }

  /**
   * Convert tag to API class name
   */
  private toApiClassName(tag: string): string {
    // Remove special characters and capitalize
    const cleaned = tag.replace(/[^a-zA-Z0-9]/g, ' ');
    const words = cleaned.split(/\s+/).filter(Boolean);
    const pascalCase = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    return pascalCase + 'Api';
  }

  /**
   * Collect imports from operations
   */
  private collectImports(operations: CodegenOperation[]): string[] {
    const imports = new Set<string>();

    for (const op of operations) {
      for (const imp of op.imports) {
        imports.add(imp);
      }
    }

    return Array.from(imports).sort();
  }
}

/**
 * Create a generator with the given config and metadata
 */
export function createGenerator(
  config: CodegenConfig,
  metadata: GeneratorMetadata
): DefaultGenerator {
  return new DefaultGenerator(config, metadata);
}
