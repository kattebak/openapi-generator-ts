/**
 * PHP Generator
 * Generates PHP client code using Guzzle or PSR-18
 */
import type { CodegenConfig, GeneratorMetadata } from "../core/config.js";

/**
 * PHP reserved words
 * From https://www.php.net/manual/en/reserved.keywords.php
 * Plus local variables used in API methods
 */
const PHP_RESERVED_WORDS = new Set([
	// Local variables used in API methods (endpoints)
	"resourcePath",
	"httpBody",
	"queryParams",
	"headerParams",
	"formParams",
	"_header_accept",
	"_tempBody",

	// PHP reserved words
	"__halt_compiler",
	"abstract",
	"and",
	"array",
	"as",
	"break",
	"callable",
	"case",
	"catch",
	"class",
	"clone",
	"const",
	"continue",
	"declare",
	"default",
	"die",
	"do",
	"echo",
	"else",
	"elseif",
	"empty",
	"enddeclare",
	"endfor",
	"endforeach",
	"endif",
	"endswitch",
	"endwhile",
	"eval",
	"exit",
	"extends",
	"final",
	"for",
	"foreach",
	"function",
	"global",
	"goto",
	"if",
	"implements",
	"include",
	"include_once",
	"instanceof",
	"insteadof",
	"interface",
	"isset",
	"list",
	"namespace",
	"new",
	"or",
	"print",
	"private",
	"protected",
	"public",
	"require",
	"require_once",
	"return",
	"static",
	"switch",
	"throw",
	"trait",
	"try",
	"unset",
	"use",
	"var",
	"while",
	"xor",
]);

/**
 * PHP type mappings
 */
const PHP_TYPE_MAPPINGS: Record<string, string> = {
	// Primitives
	integer: "int",
	long: "int",
	number: "float",
	float: "float",
	decimal: "float",
	double: "float",
	string: "string",
	byte: "int",
	boolean: "bool",

	// Date/Time
	date: "\\DateTime",
	Date: "\\DateTime",
	DateTime: "\\DateTime",

	// File
	file: "\\SplFileObject",

	// Collections
	map: "array",
	array: "array",
	list: "array",

	// Object
	object: "object",

	// Binary
	binary: "string",
	ByteArray: "string",

	// Special
	UUID: "string",
	URI: "string",
	AnyType: "mixed",
};

/**
 * PHP import mappings
 */
const PHP_IMPORT_MAPPINGS: Record<string, string> = {};

/**
 * Create PHP generator metadata
 */
export function createPhpMetadata(): GeneratorMetadata {
	return {
		name: "php",
		description: "Generates PHP client code using Guzzle or PSR-18",
		type: "client",
		language: "PHP",
		libraries: ["guzzle", "psr-18"],
		defaultLibrary: "guzzle",
		embeddedTemplateDir: "php",
		modelFileExtension: ".php",
		apiFileExtension: ".php",
		modelTemplateFile: "model.mustache",
		apiTemplateFile: "api.mustache",
		defaultModelPackage: "{{srcBasePath}}/Model",
		defaultApiPackage: "{{srcBasePath}}/Api",
		supportingFiles: [
			{
				templateFile: "ApiException.mustache",
				folder: "{{srcBasePath}}",
				destinationFilename: "ApiException.php",
			},
			{
				templateFile: "Configuration.mustache",
				folder: "{{srcBasePath}}",
				destinationFilename: "Configuration.php",
			},
			{
				templateFile: "FormDataProcessor.mustache",
				folder: "{{srcBasePath}}",
				destinationFilename: "FormDataProcessor.php",
			},
			{
				templateFile: "ObjectSerializer.mustache",
				folder: "{{srcBasePath}}",
				destinationFilename: "ObjectSerializer.php",
			},
			{
				templateFile: "ModelInterface.mustache",
				folder: "{{srcBasePath}}/Model",
				destinationFilename: "ModelInterface.php",
			},
			{
				templateFile: "HeaderSelector.mustache",
				folder: "{{srcBasePath}}",
				destinationFilename: "HeaderSelector.php",
			},
			{
				templateFile: "composer.mustache",
				folder: "",
				destinationFilename: "composer.json",
			},
			{
				templateFile: "README.mustache",
				folder: "",
				destinationFilename: "README.md",
			},
			{
				templateFile: "phpunit.xml.mustache",
				folder: "",
				destinationFilename: "phpunit.xml.dist",
			},
			{
				templateFile: ".travis.yml",
				folder: "",
				destinationFilename: ".travis.yml",
			},
			{
				templateFile: ".php-cs-fixer.dist.php",
				folder: "",
				destinationFilename: ".php-cs-fixer.dist.php",
			},
			{
				templateFile: "git_push.sh.mustache",
				folder: "",
				destinationFilename: "git_push.sh",
			},
			{
				templateFile: "gitignore",
				folder: "",
				destinationFilename: ".gitignore",
			},
		],
		reservedWords: PHP_RESERVED_WORDS,
		defaultTypeMappings: PHP_TYPE_MAPPINGS,
		defaultImportMappings: PHP_IMPORT_MAPPINGS,
	};
}

/**
 * Get PHP-specific additional properties
 */
export function getPhpAdditionalProperties(
	config: CodegenConfig,
): Record<string, unknown> {
	const invokerPackage =
		config.additionalProperties?.invokerPackage ?? "OpenAPI\\Client";
	const packageName = config.packageName ?? "OpenAPIClient-php";

	return {
		invokerPackage,
		packageName,
		srcBasePath: config.additionalProperties?.srcBasePath ?? "lib",
		testBasePath: config.additionalProperties?.testBasePath ?? "test",
		apiDirName: "Api",
		modelDirName: "Model",
		variableNamingConvention:
			config.additionalProperties?.variableNamingConvention ?? "snake_case",
		artifactVersion: config.additionalProperties?.artifactVersion ?? "1.0.0",
		artifactUrl:
			config.additionalProperties?.artifactUrl ??
			"https://openapi-generator.tech",
		licenseName: config.additionalProperties?.licenseName ?? "unlicense",
		developerOrganization:
			config.additionalProperties?.developerOrganization ?? "OpenAPI",
		developerOrganizationUrl:
			config.additionalProperties?.developerOrganizationUrl ??
			"https://openapi-generator.tech",
		hideGenerationTimestamp:
			config.additionalProperties?.hideGenerationTimestamp ?? true,
		apiDocPath: "docs/Api",
		modelDocPath: "docs/Model",
		// Git repository metadata
		gitHost: config.additionalProperties?.gitHost ?? "github.com",
		gitUserId: config.additionalProperties?.gitUserId ?? "GIT_USER_ID",
		gitRepoId: config.additionalProperties?.gitRepoId ?? "GIT_REPO_ID",
		...config.additionalProperties,
	};
}
