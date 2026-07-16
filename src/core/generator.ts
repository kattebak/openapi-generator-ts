/**
 * Default Generator
 * Main orchestrator for code generation
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { camelCase } from "es-toolkit/string";
import * as yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load generator version from package.json
function getGeneratorVersion(): string {
	try {
		const packageJsonPath = path.resolve(__dirname, "../../package.json");
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		return packageJson.version ?? "unknown";
	} catch {
		return "unknown";
	}
}

const GENERATOR_VERSION = getGeneratorVersion();

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
			toVarName: metadata.toVarName,
			postProcessProperty: metadata.postProcessProperty,
		});
		this.operationTransformer = new OperationTransformer({
			typeMappings,
			reservedWords: metadata.reservedWords,
			toOperationId: metadata.toOperationId,
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

				// Post-process operations
				if (this.metadata.postProcessOperation) {
					for (const ops of result.operations.values()) {
						for (const op of ops) {
							this.metadata.postProcessOperation(op, this.config);
						}
					}
				}

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
			// Apply generator-specific model post-processing
			if (this.metadata.postProcessModel) {
				this.metadata.postProcessModel(model, this.config);
			}

			// Convert model imports Set to array format expected by templates
			const modelImports = Array.from(model.imports)
				.sort()
				.map((imp) => ({ import: imp }));

			// The typescript-fetch model template renders the referenced model's
			// type and FromJSON/ToJSON helpers from tsImports; for TypeScript the
			// import filename is the referenced model's classname. A self-reference
			// resolves to the model's own declarations, so importing its own name
			// would collide with them (TS2440).
			const tsImports = Array.from(model.imports)
				.filter((imp) => imp !== model.classname)
				.sort()
				.map((imp) => ({ classname: imp, filename: imp }));
			const hasImports = model.hasImports || tsImports.length > 0;

			const templateData: TemplateData = {
				...globalData,
				// Wrap model in the structure expected by models.mustache: {{#models}}{{#model}}
				// The imports array must be a sibling of model (not inside it) because
				// the template uses {{#models}}{{#imports}}...{{/imports}}{{#model}}...{{/model}}{{/models}}
				models: [
					{
						// imports at the same level as model for {{#models}}{{#imports}}
						imports: modelImports,
						model: {
							...model,
							classname: model.classname,
							tsImports,
							hasImports,
						},
					},
				],
				// Also provide at top level for partials that access directly
				...model,
				model,
				classname: model.classname,
				// Provide imports at top level for templates that access {{#imports}}
				imports: modelImports,
				package: this.config.modelPackage ?? this.config.packageName,
			};

			try {
				const content = await this.templateManager.render(
					this.metadata.modelTemplateFile,
					templateData,
				);

				// Use generator-specific filename conversion if provided
				const filename = this.metadata.toModelFilename
					? this.metadata.toModelFilename(model.classname)
					: `${model.classname}${this.metadata.modelFileExtension}`;

				// Interpolate folder path with template variables (e.g., {{packageName}})
				const modelPackagePath =
					this.config.modelPackage?.replace(/\./g, "/") ??
					this.interpolatePath(
						this.metadata.defaultModelPackage ?? "",
						templateData,
					);

				const outputPath = path.join(
					this.config.outputDir,
					modelPackagePath,
					filename,
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
		console.log(`Generating APIs for ${operations.size} tags`);
		const files: GeneratedFile[] = [];

		if (!this.templateManager) {
			throw new Error("Template manager not initialized");
		}

		const globalData = this.createGlobalTemplateData(spec);

		for (const [tag, ops] of operations) {
			const className = this.toApiClassName(tag);

			// Sort operations by operationId for consistent output matching original generator
			const sortedOps = [...ops].sort((a, b) =>
				a.operationId.localeCompare(b.operationId),
			);

			// Enhance operations with nickname and ensure classname is accessible
			// Also include template flags for proper rendering in nested contexts
			const enhancedOps = sortedOps.map((op) => ({
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

				// Use generator-specific filename conversion if provided
				const filename = this.metadata.toApiFilename
					? this.metadata.toApiFilename(className)
					: `${className}${this.metadata.apiFileExtension}`;

				console.log(`Generating API: ${className} -> ${filename}`);

				const outputPath = path.join(
					this.config.outputDir,
					this.config.apiPackage?.replace(/\./g, "/") ??
						this.metadata.defaultApiPackage ??
						"",
					filename,
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
					// Enhance each operation with classname for template access
					const enhancedOps = ops.map((op) => ({
						...op,
						classname: className,
						classFilename: className,
					}));
					return {
						classname: className,
						classFilename: className,
						baseName: tag,
						operations: {
							classname: className,
							classFilename: className,
							operation: enhancedOps,
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

				// Interpolate folder path with template variables (e.g., {{packageName}})
				const folderPath = this.interpolatePath(
					supportingFile.folder,
					templateData,
				);

				const outputPath = path.join(
					this.config.outputDir,
					folderPath,
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
	 * Derive a package name from the API title
	 * This is used when packageName is not explicitly set
	 */
	private derivePackageName(title: string): string {
		// Remove common prefixes like "Swagger", lowercase, remove non-alphanumeric
		return title
			.replace(/^swagger\s+/i, "")
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "");
	}

	/**
	 * Interpolate simple template variables in folder paths
	 * Supports {{variableName}} syntax for path interpolation
	 */
	private interpolatePath(
		pathTemplate: string,
		data: Record<string, unknown>,
	): string {
		return pathTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
			const value = data[key];
			return typeof value === "string" ? value : String(value ?? "");
		});
	}

	/**
	 * Create global template data available to all templates
	 */
	private createGlobalTemplateData(spec: ParsedSpec): TemplateData {
		const info = getInfo(spec.document);
		const servers = getServers(spec.document);
		const tags = getTags(spec.document);

		// Derive package name from API title if not explicitly set
		const packageName =
			this.config.packageName ??
			(info.title ? this.derivePackageName(info.title) : "openapi");

		// Process description for templates that need newline formatting
		const appDescription =
			info.description ||
			"No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)";
		const appDescriptionWithNewLines = appDescription
			.split("\n")
			.map((line) => line.trim())
			.join("\n");

		return {
			// OpenAPI info
			appName: info.title,
			appVersion: info.version,
			version: info.version, // Alias for templates using {{version}}
			appDescription,
			appDescriptionWithNewLines,
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
			packageName: packageName,
			apiPackage: this.config.apiPackage ?? packageName,
			modelPackage: this.config.modelPackage ?? packageName,
			invokerPackage: this.config.invokerPackage ?? packageName,

			// Generator info
			generatorClass: this.metadata.name,
			generatorVersion: GENERATOR_VERSION,
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

			// OpenAPI spec in YAML format
			"openapi-yaml": yaml.dump(spec.document),
		};
	}

	/**
	 * Convert tag to API class name
	 */
	private toApiClassName(tag: string): string {
		const suffix = this.metadata.apiNameSuffix ?? "Api";

		// Use generator-specific conversion if provided
		if (this.metadata.toApiClassName) {
			return this.metadata.toApiClassName(tag, suffix);
		}

		// Default: Remove special characters and capitalize
		const cleaned = tag.replace(/[^a-zA-Z0-9]/g, " ");
		const words = cleaned.split(/\s+/).filter(Boolean);
		const pascalCase = words
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join("");

		return `${pascalCase}${suffix}`;
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
