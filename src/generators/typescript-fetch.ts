/**
 * TypeScript Fetch Generator
 * Generates TypeScript client code using the Fetch API
 */
import type { CodegenConfig, GeneratorMetadata } from "../core/config.js";

/**
 * TypeScript reserved words
 */
const TYPESCRIPT_RESERVED_WORDS = new Set([
	// Language types that conflict with model names
	"Error",
	"Map",
	"Array",
	"Object",
	"String",
	"Number",
	"Boolean",
	"Date",
	"Symbol",
	"Function",
	// Keywords
	"abstract",
	"await",
	"boolean",
	"break",
	"byte",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"double",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"final",
	"finally",
	"float",
	"for",
	"function",
	"goto",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"int",
	"interface",
	"let",
	"long",
	"native",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"short",
	"static",
	"super",
	"switch",
	"synchronized",
	"this",
	"throw",
	"throws",
	"transient",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"volatile",
	"while",
	"with",
	"yield",
	"type",
]);

/**
 * TypeScript type mappings
 */
const TYPESCRIPT_TYPE_MAPPINGS: Record<string, string> = {
	// Primitives
	integer: "number",
	long: "number",
	float: "number",
	double: "number",
	number: "number",
	decimal: "number",
	string: "string",
	boolean: "boolean",

	// Date/Time
	date: "string",
	"date-time": "string",
	DateTime: "Date",
	Date: "Date",

	// Binary
	binary: "Blob",
	byte: "string",
	ByteArray: "string",
	file: "File",
	File: "File",

	// Special
	uuid: "string",
	uri: "string",
	URI: "string",
	email: "string",
	password: "string",

	// Collections
	array: "Array",
	list: "Array",
	set: "Set",
	map: "Record",
	object: "object",

	// Any
	AnyType: "any",
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
		name: "typescript-fetch",
		description: "Generates TypeScript client code using the Fetch API",
		type: "client",
		language: "TypeScript",
		libraries: ["default", "es6-fetch"],
		defaultLibrary: "default",
		embeddedTemplateDir: "typescript-fetch",
		modelFileExtension: ".ts",
		apiFileExtension: ".ts",
		defaultApiPackage: "apis",
		defaultModelPackage: "models",
		modelTemplateFile: "models.mustache",
		apiTemplateFile: "apis.mustache",
		supportingFiles: [
			{
				templateFile: "index.mustache",
				folder: "",
				destinationFilename: "index.ts",
			},
			{
				templateFile: "runtime.mustache",
				folder: "",
				destinationFilename: "runtime.ts",
			},
			{
				templateFile: "configuration.mustache",
				folder: "",
				destinationFilename: "configuration.ts",
			},
			{
				templateFile: "package.mustache",
				folder: "",
				destinationFilename: "package.json",
			},
			{
				templateFile: "tsconfig.mustache",
				folder: "",
				destinationFilename: "tsconfig.json",
			},
			{
				templateFile: "README.mustache",
				folder: "",
				destinationFilename: "README.md",
			},
			{
				templateFile: "apis.index.mustache",
				folder: "apis",
				destinationFilename: "index.ts",
			},
			{
				templateFile: "models.index.mustache",
				folder: "models",
				destinationFilename: "index.ts",
			},
			{
				templateFile: "gitignore",
				folder: "",
				destinationFilename: ".gitignore",
			},
			{
				templateFile: "npmignore.mustache",
				folder: "",
				destinationFilename: ".npmignore",
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
	config: CodegenConfig,
): Record<string, unknown> {
	return {
		supportsES6: true,
		useSingleRequestParameter:
			config.additionalProperties?.useSingleRequestParameter ?? true,
		withInterfaces: config.additionalProperties?.withInterfaces ?? false,
		npmName: config.additionalProperties?.npmName ?? config.packageName,
		npmVersion: config.additionalProperties?.npmVersion ?? "1.0.0",
		snapshot: false,
		// Git repository metadata
		gitHost: config.additionalProperties?.gitHost ?? "github.com",
		gitUserId: config.additionalProperties?.gitUserId ?? "GIT_USER_ID",
		gitRepoId: config.additionalProperties?.gitRepoId ?? "GIT_REPO_ID",
		...config.additionalProperties,
	};
}
