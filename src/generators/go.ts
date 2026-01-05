/**
 * Go Generator
 * Generates Go client code
 */
import { pascalCase, snakeCase } from "es-toolkit/string";
import type { CodegenConfig, GeneratorMetadata } from "../core/config.js";

/**
 * Go reserved words
 * From https://golang.org/ref/spec#Keywords
 * Plus common data types and error
 */
const GO_RESERVED_WORDS = new Set([
	// Data types
	"string",
	"bool",
	"uint",
	"uint8",
	"uint16",
	"uint32",
	"uint64",
	"int",
	"int8",
	"int16",
	"int32",
	"int64",
	"float32",
	"float64",
	"complex64",
	"complex128",
	"rune",
	"byte",
	"uintptr",

	// Keywords
	"break",
	"default",
	"func",
	"interface",
	"select",
	"case",
	"defer",
	"go",
	"map",
	"struct",
	"chan",
	"else",
	"goto",
	"package",
	"switch",
	"const",
	"fallthrough",
	"if",
	"range",
	"type",
	"continue",
	"for",
	"import",
	"return",
	"var",
	"error",
	"nil",
]);

/**
 * Go type mappings
 */
const GO_TYPE_MAPPINGS: Record<string, string> = {
	// Primitives
	integer: "int32",
	int32: "int32",
	int64: "int64",
	long: "int64",
	number: "float32",
	float: "float32",
	double: "float64",
	decimal: "float64",
	boolean: "bool",
	string: "string",

	// Special strings
	UUID: "string",
	URI: "string",
	date: "string",
	password: "string",

	// DateTime
	DateTime: "time.Time",

	// File/Binary
	File: "*os.File",
	file: "*os.File",
	binary: "*os.File",
	ByteArray: "string",

	// Null
	null: "nil",

	// Object/Any
	object: "map[string]interface{}",
	AnyType: "interface{}",
	array: "[]",
};

/**
 * Go import mappings
 */
const GO_IMPORT_MAPPINGS: Record<string, string> = {
	"time.Time": "time",
	"*os.File": "os",
};

/**
 * Helper to convert to underscore (snake_case) - matches Java underscore() function
 */
function underscore(name: string): string {
	return snakeCase(name);
}

/**
 * Go-specific API class name conversion
 * Creates "PetsAPI" style names (uppercase API suffix)
 */
function toGoApiClassName(tag: string, suffix: string): string {
	return pascalCase(tag) + suffix;
}

/**
 * Go-specific model filename conversion
 * Creates "model_pet.go" style filenames
 */
function toGoModelFilename(modelName: string): string {
	return `model_${underscore(modelName)}.go`;
}

/**
 * Go-specific API filename conversion
 * Creates "api_pets.go" style filenames
 */
function toGoApiFilename(className: string): string {
	// Remove the API suffix before converting to snake_case
	const baseName = className.replace(/API$/i, "");
	const filename = `api_${underscore(baseName)}.go`;
	console.log(`API Filename: ${className} -> ${filename}`);
	return filename;
}

/**
 * Go-specific operation ID conversion
 * Go exported methods must be PascalCase
 */
function toGoOperationId(name: string): string {
	return pascalCase(name);
}

/**
 * Go-specific variable name conversion
 * Go exported fields must be PascalCase (capitalized) to be accessible from other packages
 */
function toGoVarName(name: string): string {
	// Handle reserved words
	if (GO_RESERVED_WORDS.has(name.toLowerCase())) {
		return `${pascalCase(name)}_`;
	}

	// If it's all upper case, keep it (e.g., ID, URL)
	if (/^[A-Z_]+$/.test(name)) {
		return name;
	}

	// Convert to PascalCase for Go exported fields
	return pascalCase(name);
}

/**
 * Post-process an operation for Go-specific transformations.
 * Sets httpMethod to PascalCase (e.g. "Post") for http.MethodPost.
 */
function postProcessGoOperation(
	operation: import("../models/index.js").CodegenOperation,
): void {
	console.log(`Processing operation: ${operation.operationId}`);
	operation.httpMethod = pascalCase(operation.httpMethod);

	// Go-specific parameter processing
	for (const param of operation.allParams) {
		// Set x-export-param-name for method builder pattern
		// e.g. func (r Request) Pet(pet Pet) Request
		param.vendorExtensions["x-export-param-name"] = pascalCase(param.paramName);
	}

	// Add imports if needed
	if (operation.pathParams.length > 0) {
		operation.imports.add("strings");
	}
}

/**
 * Post-process a property for Go-specific transformations.
 * Sets x-go-base-type and x-go-datatag vendor extensions.
 */
function postProcessGoProperty(
	property: import("../models/index.js").CodegenProperty,
): void {
	// x-go-base-type is the original data type (before nullable transformation)
	property.vendorExtensions["x-go-base-type"] = property.dataType;

	// Build the JSON struct tag
	let tag = `json:"${property.baseName}`;
	if (!property.required) {
		tag += ",omitempty";
	}
	tag += '"';

	// Wrap in backticks for Go struct tag syntax
	property.vendorExtensions["x-go-datatag"] = ` \`${tag}\``;
}

/**
 * Post-process a model for Go-specific transformations.
 * Sets x-go-generate-marshal-json and x-go-generate-unmarshal-json vendor extensions.
 * Also adds required imports (bytes, fmt) for marshal/unmarshal methods.
 */
function postProcessGoModel(
	model: import("../models/index.js").CodegenModel,
): void {
	// Enable MarshalJSON/UnmarshalJSON generation for all models
	// This matches the Java generator's default behavior
	model.vendorExtensions["x-go-generate-marshal-json"] = true;
	model.vendorExtensions["x-go-generate-unmarshal-json"] = true;

	// Add imports needed for MarshalJSON/UnmarshalJSON
	// bytes is used for bytes.NewReader in UnmarshalJSON
	// fmt is used for fmt.Errorf when validating required properties
	model.imports.add("bytes");
	model.imports.add("fmt");
}

/**
 * Create Go generator metadata
 */
export function createGoMetadata(): GeneratorMetadata {
	return {
		name: "go",
		description: "Generates Go client code",
		type: "client",
		language: "Go",
		libraries: ["default"],
		defaultLibrary: "default",
		embeddedTemplateDir: "go",
		modelFileExtension: ".go",
		apiFileExtension: ".go",
		// Go uses flat structure - no subdirectories
		defaultApiPackage: "",
		defaultModelPackage: "",
		modelTemplateFile: "model.mustache",
		apiTemplateFile: "api.mustache",
		modelDocTemplateFile: "model_doc.mustache",
		apiDocTemplateFile: "api_doc.mustache",
		// Go naming conventions
		apiNameSuffix: "API",
		toApiClassName: toGoApiClassName,
		toModelFilename: toGoModelFilename,
		toApiFilename: toGoApiFilename,
		toVarName: toGoVarName,
		toOperationId: toGoOperationId,
		postProcessProperty: postProcessGoProperty,
		postProcessModel: postProcessGoModel,
		postProcessOperation: postProcessGoOperation,
		supportingFiles: [
			{
				templateFile: "openapi.mustache",
				folder: "api",
				destinationFilename: "openapi.yaml",
			},
			{
				templateFile: "README.mustache",
				folder: "",
				destinationFilename: "README.md",
			},
			{
				templateFile: "gitignore.mustache",
				folder: "",
				destinationFilename: ".gitignore",
			},
			{
				templateFile: "git_push.sh.mustache",
				folder: "",
				destinationFilename: "git_push.sh",
			},
			{
				templateFile: "configuration.mustache",
				folder: "",
				destinationFilename: "configuration.go",
			},
			{
				templateFile: "client.mustache",
				folder: "",
				destinationFilename: "client.go",
			},
			{
				templateFile: "response.mustache",
				folder: "",
				destinationFilename: "response.go",
			},
			{
				templateFile: "utils.mustache",
				folder: "",
				destinationFilename: "utils.go",
			},
			{
				templateFile: "go.mod.mustache",
				folder: "",
				destinationFilename: "go.mod",
			},
			{
				templateFile: "go.sum.mustache",
				folder: "",
				destinationFilename: "go.sum",
			},
			{
				templateFile: ".travis.yml",
				folder: "",
				destinationFilename: ".travis.yml",
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
export function getGoAdditionalProperties(
	config: CodegenConfig,
): Record<string, unknown> {
	return {
		packageName: config.packageName ?? "openapi",
		packageVersion: config.additionalProperties?.packageVersion ?? "1.0.0",
		hideGenerationTimestamp:
			config.additionalProperties?.hideGenerationTimestamp ?? true,
		withGoMod: config.additionalProperties?.withGoMod ?? true,
		withXml: config.additionalProperties?.withXml ?? false,
		withAWSV4Signature:
			config.additionalProperties?.withAWSV4Signature ?? false,
		enumClassPrefix: config.additionalProperties?.enumClassPrefix ?? false,
		structPrefix: config.additionalProperties?.structPrefix ?? false,
		generateInterfaces:
			config.additionalProperties?.generateInterfaces ?? false,
		useOneOfDiscriminatorLookup:
			config.additionalProperties?.useOneOfDiscriminatorLookup ?? false,
		generateMarshalJSON:
			config.additionalProperties?.generateMarshalJSON ?? true,
		generateUnmarshalJSON:
			config.additionalProperties?.generateUnmarshalJSON ?? true,
		useDefaultValuesForRequiredVars:
			config.additionalProperties?.useDefaultValuesForRequiredVars ?? false,
		goImportAlias:
			config.additionalProperties?.goImportAlias ?? "openapiclient",
		apiDocPath: "docs/",
		modelDocPath: "docs/",
		// Git repository metadata
		gitHost: config.additionalProperties?.gitHost ?? "github.com",
		gitUserId: config.additionalProperties?.gitUserId ?? "GIT_USER_ID",
		gitRepoId: config.additionalProperties?.gitRepoId ?? "GIT_REPO_ID",
		...config.additionalProperties,
	};
}
