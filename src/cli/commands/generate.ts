/**
 * Generate command handler
 */
import type { CodegenConfig } from '../../core/config.js';
import { createDefaultConfig } from '../../core/config.js';
import { createGenerator } from '../../core/generator.js';
import { getGenerator, hasGenerator, listGenerators } from '../../generators/index.js';

export interface GenerateOptions {
  inputSpec: string;
  generatorName: string;
  outputDir: string;
  templateDir?: string;
  library?: string;
  packageName?: string;
  apiPackage?: string;
  modelPackage?: string;
  generateModels?: boolean;
  generateApis?: boolean;
  generateSupportingFiles?: boolean;
  skipOverwrite?: boolean;
  minimalUpdate?: boolean;
  dryRun?: boolean;
  additionalProperties?: Record<string, string>;
  typeMappings?: Record<string, string>;
  importMappings?: Record<string, string>;
  verbose?: boolean;
  debug?: boolean;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const startTime = Date.now();

  // Check if generator exists
  if (!hasGenerator(options.generatorName)) {
    console.error(`Unknown generator: ${options.generatorName}`);
    console.log('\nAvailable generators:');
    for (const gen of listGenerators()) {
      console.log(`  - ${gen}`);
    }
    process.exit(1);
  }

  // Get generator metadata
  const metadata = getGenerator(options.generatorName);
  if (!metadata) {
    console.error(`Could not load generator: ${options.generatorName}`);
    process.exit(1);
  }

  // Create config
  const config: CodegenConfig = createDefaultConfig({
    inputSpec: options.inputSpec,
    generatorName: options.generatorName,
    outputDir: options.outputDir,
    templateDir: options.templateDir,
    library: options.library,
    packageName: options.packageName,
    apiPackage: options.apiPackage,
    modelPackage: options.modelPackage,
    generateModels: options.generateModels,
    generateApis: options.generateApis,
    generateSupportingFiles: options.generateSupportingFiles,
    skipOverwrite: options.skipOverwrite,
    minimalUpdate: options.minimalUpdate,
    dryRun: options.dryRun,
    additionalProperties: options.additionalProperties,
    typeMappings: options.typeMappings,
    importMappings: options.importMappings,
    verbose: options.verbose,
    debug: options.debug,
    validateSpec: true,
  });

  if (options.verbose) {
    console.log('OpenAPI Generator');
    console.log('=================');
    console.log(`Generator: ${options.generatorName}`);
    console.log(`Input: ${options.inputSpec}`);
    console.log(`Output: ${options.outputDir}`);
    if (options.templateDir) {
      console.log(`Templates: ${options.templateDir}`);
    }
    if (options.library) {
      console.log(`Library: ${options.library}`);
    }
    console.log('');
  }

  // Create and run generator
  const generator = createGenerator(config, metadata);

  try {
    const result = await generator.generate();

    const elapsed = Date.now() - startTime;

    // Summary
    const writtenFiles = result.files.filter((f) => !f.skipped);
    const skippedFiles = result.files.filter((f) => f.skipped);

    if (options.verbose || options.dryRun) {
      console.log('');
      console.log('Generation Summary');
      console.log('------------------');
      console.log(`Models: ${result.models.size}`);
      console.log(`API Tags: ${result.operations.size}`);
      console.log(`Files written: ${writtenFiles.length}`);
      console.log(`Files skipped: ${skippedFiles.length}`);
      console.log(`Time: ${elapsed}ms`);

      if (result.warnings.length > 0) {
        console.log('');
        console.log('Warnings:');
        for (const warning of result.warnings) {
          console.log(`  - ${warning}`);
        }
      }
    } else {
      console.log(
        `Generated ${writtenFiles.length} files in ${options.outputDir} (${elapsed}ms)`
      );
    }

    if (options.dryRun) {
      console.log('');
      console.log('(Dry run - no files were actually written)');
    }
  } catch (error) {
    console.error('Generation failed:', error instanceof Error ? error.message : error);
    if (options.debug) {
      console.error(error);
    }
    process.exit(1);
  }
}
