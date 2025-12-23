/**
 * Default Generator
 * Main orchestrator for code generation
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { camelCase } from "es-toolkit/string";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { OpenAPIV3 } from "openapi-types";
import type { CodegenModel, CodegenOperation } from "../models/index.js";
import {
	getInfo,
	getPaths,
	getSchemas,
	getSecuritySchemes,
	getServers,
	getTags,
	type ParsedSpec,
	parseSpec,
} from "../parser/openapi-parser.js";
import { OperationTransformer } from "../parser/operation-transformer.js";
import { SchemaTransformer } from "../parser/schema-transformer.js";
import {
	TemplateManager,
	type TemplateManagerConfig,
} from "../template/template-manager.js";
import type { CodegenConfig, GeneratorMetadata } from "./config.js";
import type { GeneratedFile, TemplateData } from "./types.js";

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

		this.schemaTransformer = new SchemaTransformer({
			typeMappings,
			reservedWords: metadata.reservedWords,
		});
		this.operationTransformer = new OperationTransformer({
			typeMappings,
			reservedWords: metadata.reservedWords,
		});

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
			path.join(__dirname, "../../templates"),
			// In node_modules
			path.join(
				process.cwd(),
				"node_modules/@kattebak/openapi-generator-ts/templates",
			),
			// Development - Java resources
			path.join(process.cwd(), "modules/openapi-generator/src/main/resources"),
			// Custom template dir
			this.config.templateDir,
		].filter(Boolean) as string[];

		for (const candidate of candidates) {
			if (fs.existsSync(candidate)) {
				return candidate;
			}
		}

		// Fallback to Java resources in workspace
		return path.join(
			process.cwd(),
			"modules/openapi-generator/src/main/resources",
		);
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
				// Use bundle mode (default) to preserve $refs for proper type resolution
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
					console.log("Processing schemas...");
				}

				const schemas = getSchemas(spec.document);
				result.models = this.schemaTransformer.transformSchemas(
					schemas as Record<string, OpenAPIV3.SchemaObject>,
				);

				// Generate model files
				const modelFiles = await this.generateModels(result.models, spec);
				result.files.push(...modelFiles);
			}

			// Process operations
			if (this.config.generateApis !== false) {
				if (this.config.verbose) {
					console.log("Processing operations...");
				}

				const paths = getPaths(spec.document);
				const securitySchemes = getSecuritySchemes(spec.document);
				const schemas = getSchemas(spec.document);

				result.operations = this.operationTransformer.transformPaths(
					paths,
					securitySchemes,
					schemas as Record<string, OpenAPIV3.SchemaObject>,
				);

				// Generate API files
				const apiFiles = await this.generateApis(
					result.operations,
					result.models,
					spec,
				);
				result.files.push(...apiFiles);
			}

			// Generate supporting files
			if (this.config.generateSupportingFiles !== false) {
				if (this.config.verbose) {
					console.log("Generating supporting files...");
				}

				const supportingFiles = await this.generateSupportingFiles(
					result.models,
					result.operations,
					spec,
				);
				result.files.push(...supportingFiles);
			}

			if (this.config.verbose) {
				console.log(`Generated ${result.files.length} files`);
			}
		} catch (error) {
			result.errors.push(
				error instanceof Error ? error.message : String(error),
			);
			throw error;
		}

		return result;
	}

	/**
	 * Generate model files
	 */
	private async generateModels(
		models: Map<string, CodegenModel>,
		spec: ParsedSpec,
	): Promise<GeneratedFile[]> {
		const files: GeneratedFile[] = [];

		if (!this.templateManager) {
			throw new Error("Template manager not initialized");
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
					templateData,
				);

				const outputPath = path.join(
					this.config.outputDir,
					this.config.modelPackage?.replace(/\./g, "/") ??
						this.metadata.defaultModelPackage ??
						"models",
					`${model.classname}${this.metadata.modelFileExtension}`,
				);

				const result = await this.templateManager.writeFile(
					outputPath,
					content,
				);
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
		spec: ParsedSpec,
	): Promise<GeneratedFile[]> {
		const files: GeneratedFile[] = [];

		if (!this.templateManager) {
			throw new Error("Template manager not initialized");
		}

		const globalData = this.createGlobalTemplateData(spec);

		for (const [tag, ops] of operations) {
			const className = this.toApiClassName(tag);

			// Enhance operations with nickname and ensure classname is accessible
			// Also include template flags for proper rendering in nested contexts
			const enhancedOps = ops.map((op) => ({
				...op,
				nickname: op.nickname ?? op.operationId,
				classname: className,
				useSingleRequestParameter: globalData.useSingleRequestParameter ?? true,
				withInterfaces: globalData.withInterfaces ?? true,
				withoutRuntimeChecks: globalData.withoutRuntimeChecks ?? false,
				prefixParameterInterfaces:
					globalData.prefixParameterInterfaces ?? false,
			}));

			// Include global boolean flags in operations context for nested access
			const operationContext = {
				classname: className,
				operation: enhancedOps,
				useSingleRequestParameter: globalData.useSingleRequestParameter ?? true,
				withInterfaces: globalData.withInterfaces ?? true,
				withoutRuntimeChecks: globalData.withoutRuntimeChecks ?? false,
				prefixParameterInterfaces:
					globalData.prefixParameterInterfaces ?? false,
			};

			const templateData: TemplateData = {
				...globalData,
				classname: className,
				baseName: tag,
				operations: operationContext,
				operation: enhancedOps,
				models: Array.from(models.values()),
				imports: this.collectImports(ops),
				package: this.config.apiPackage ?? this.config.packageName,
			};

			try {
				const content = await this.templateManager.render(
					this.metadata.apiTemplateFile,
					templateData,
				);

				const outputPath = path.join(
					this.config.outputDir,
					this.config.apiPackage?.replace(/\./g, "/") ??
						this.metadata.defaultApiPackage ??
						"api",
					`${className}${this.metadata.apiFileExtension}`,
				);

				const result = await this.templateManager.writeFile(
					outputPath,
					content,
				);
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
		spec: ParsedSpec,
	): Promise<GeneratedFile[]> {
		const files: GeneratedFile[] = [];

		if (!this.templateManager) {
			throw new Error("Template manager not initialized");
		}

		const globalData = this.createGlobalTemplateData(spec);

		// Wrap each model in { model: ... } for template compatibility
		const wrappedModels = Array.from(models.values()).map((model) => ({
			model,
		}));

		const templateData: TemplateData = {
			...globalData,
			models: wrappedModels,
			apis: Array.from(operations.entries()).map(([tag, ops]) => ({
				classname: this.toApiClassName(tag),
				baseName: tag,
				operations: ops,
			})),
			apiInfo: {
				apis: Array.from(operations.entries()).map(([tag, ops]) => {
					const className = this.toApiClassName(tag);
					return {
						classname: className,
						classFilename: className,
						baseName: tag,
						operations: {
							classname: className,
							classFilename: className,
							operation: ops,
						},
					};
				}),
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
					templateData,
				);

				const outputPath = path.join(
					this.config.outputDir,
					supportingFile.folder,
					supportingFile.destinationFilename,
				);

				const result = await this.templateManager.writeFile(
					outputPath,
					content,
				);
				files.push(result);

				if (this.config.verbose && !result.skipped) {
					console.log(`  Generated: ${outputPath}`);
				}
			} catch (error) {
				// Supporting files are optional - don't fail if template not found
				if (this.config.debug) {
					console.warn(
						`  Could not generate supporting file ${supportingFile.templateFile}: ${error}`,
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
			basePath: servers[0]?.url ?? "",

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

			// Default template properties (can be overridden by additionalProperties)
			useSingleRequestParameter: true,
			withInterfaces: false,
			withoutRuntimeChecks: false,
			prefixParameterInterfaces: false,
			importFileExtension: "", // TypeScript imports don't need extensions

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
		const cleaned = tag.replace(/[^a-zA-Z0-9]/g, " ");
		const words = cleaned.split(/\s+/).filter(Boolean);
		const pascalCase = words
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join("");

		return `${pascalCase}Api`;
	}

	/**
	 * Collect imports from operations
	 * Returns array of { className, classname, classVarName } objects for template
	 */
	private collectImports(
		operations: CodegenOperation[],
	): { className: string; classname: string; classVarName: string }[] {
		const imports = new Set<string>();

		for (const op of operations) {
			for (const imp of op.imports) {
				imports.add(imp);
			}
		}

		return Array.from(imports)
			.sort()
			.map((name) => ({
				className: name,
				classname: name,
				classVarName: camelCase(name),
			}));
	}
}

/**
 * Create a generator with the given config and metadata
 */
export function createGenerator(
	config: CodegenConfig,
	metadata: GeneratorMetadata,
): DefaultGenerator {
	return new DefaultGenerator(config, metadata);
}
