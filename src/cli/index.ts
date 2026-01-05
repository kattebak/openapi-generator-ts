#!/usr/bin/env node
/**
 * OpenAPI Generator CLI
 * Uses Node's native parseArgs for argument parsing (Node 18.3+)
 */
import { parseArgs } from "node:util";
import { generateCommand } from "./commands/generate.js";
import { listCommand } from "./commands/list.js";
import { validateCommand } from "./commands/validate.js";

const VERSION = "0.1.0";

const USAGE = `
OpenAPI Generator - Generate code from OpenAPI specifications

Usage:
  openapi-generator <command> [options]

Commands:
  generate    Generate code from an OpenAPI specification
  validate    Validate an OpenAPI specification
  list        List available generators

Options:
  -h, --help      Show this help message
  -v, --version   Show version number

Examples:
  openapi-generator generate -i petstore.json -g typescript-fetch -o ./generated
  openapi-generator validate -i petstore.yaml
  openapi-generator list

For more information about a command:
  openapi-generator <command> --help
`;

const GENERATE_USAGE = `
Usage: openapi-generator generate [options]

Generate code from an OpenAPI specification

Required Options:
  -i, --input <file>       Path to OpenAPI spec file (JSON or YAML)
  -g, --generator <name>   Generator name (e.g., typescript-fetch)

Output Options:
  -o, --output <dir>       Output directory (default: ./generated)
  -t, --templates <dir>    Custom templates directory
  --library <name>         Library/variant to use

Package Options:
  -p, --package <name>     Package name
  --api-package <name>     API package name
  --model-package <name>   Model package name

Generation Options:
  --skip-models            Skip model generation
  --skip-apis              Skip API generation
  --skip-supporting        Skip supporting files
  --skip-overwrite         Don't overwrite existing files
  --minimal-update         Only write if content changed
  --dry-run                Don't write files, show what would be generated

Additional Options:
  --additional-properties <props>   Additional properties as key=value,key2=value2
  --type-mappings <mappings>        Type mappings as openApiType=targetType,...
  --import-mappings <mappings>      Import mappings as type=import,...

Other:
  -v, --verbose            Enable verbose output
  --debug                  Enable debug output
  -h, --help               Show this help message
`;

const VALIDATE_USAGE = `
Usage: openapi-generator validate [options]

Validate an OpenAPI specification

Options:
  -i, --input <file>    Path to OpenAPI spec file (JSON or YAML)
  --strict              Enable strict validation
  -h, --help            Show this help message
`;

const LIST_USAGE = `
Usage: openapi-generator list

List all available generators
`;

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Handle no args or top-level help
	if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
		console.log(USAGE);
		process.exit(0);
	}

	// Handle version
	if (args[0] === "-v" || args[0] === "--version") {
		console.log(VERSION);
		process.exit(0);
	}

	const command = args[0];
	const commandArgs = args.slice(1);

	try {
		switch (command) {
			case "generate":
				await handleGenerate(commandArgs);
				break;
			case "validate":
				await handleValidate(commandArgs);
				break;
			case "list":
				handleList(commandArgs);
				break;
			default:
				console.error(`Unknown command: ${command}`);
				console.log(USAGE);
				process.exit(1);
		}
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		if (process.env.DEBUG) {
			console.error(error);
		}
		process.exit(1);
	}
}

async function handleGenerate(args: string[]): Promise<void> {
	// Check for help
	if (args.includes("-h") || args.includes("--help")) {
		console.log(GENERATE_USAGE);
		process.exit(0);
	}

	const { values } = parseArgs({
		args,
		options: {
			input: { type: "string", short: "i" },
			generator: { type: "string", short: "g" },
			output: { type: "string", short: "o", default: "./generated" },
			templates: { type: "string", short: "t" },
			library: { type: "string" },
			package: { type: "string", short: "p" },
			"api-package": { type: "string" },
			"model-package": { type: "string" },
			"skip-models": { type: "boolean", default: false },
			"skip-apis": { type: "boolean", default: false },
			"skip-supporting": { type: "boolean", default: false },
			"skip-overwrite": { type: "boolean", default: false },
			"minimal-update": { type: "boolean", default: true },
			"dry-run": { type: "boolean", default: false },
			"additional-properties": { type: "string" },
			"type-mappings": { type: "string" },
			"import-mappings": { type: "string" },
			verbose: { type: "boolean", short: "v", default: false },
			debug: { type: "boolean", default: false },
		},
		strict: true,
	});

	// Validate required options
	if (!values.input) {
		console.error("Error: --input (-i) is required");
		console.log(GENERATE_USAGE);
		process.exit(1);
	}

	if (!values.generator) {
		console.error("Error: --generator (-g) is required");
		console.log(GENERATE_USAGE);
		process.exit(1);
	}

	// Parse additional properties
	const additionalProperties = parseKeyValuePairs(
		values["additional-properties"] as string | undefined,
	);
	const typeMappings = parseKeyValuePairs(
		values["type-mappings"] as string | undefined,
	);
	const importMappings = parseKeyValuePairs(
		values["import-mappings"] as string | undefined,
	);

	await generateCommand({
		inputSpec: values.input as string,
		generatorName: values.generator as string,
		outputDir: values.output as string,
		templateDir: values.templates as string | undefined,
		library: values.library as string | undefined,
		packageName: values.package as string | undefined,
		apiPackage: values["api-package"] as string | undefined,
		modelPackage: values["model-package"] as string | undefined,
		generateModels: !values["skip-models"],
		generateApis: !values["skip-apis"],
		generateSupportingFiles: !values["skip-supporting"],
		skipOverwrite: values["skip-overwrite"] as boolean,
		minimalUpdate: values["minimal-update"] as boolean,
		dryRun: values["dry-run"] as boolean,
		additionalProperties,
		typeMappings,
		importMappings,
		verbose: values.verbose as boolean,
		debug: values.debug as boolean,
	});
}

async function handleValidate(args: string[]): Promise<void> {
	// Check for help
	if (args.includes("-h") || args.includes("--help")) {
		console.log(VALIDATE_USAGE);
		process.exit(0);
	}

	const { values } = parseArgs({
		args,
		options: {
			input: { type: "string", short: "i" },
			strict: { type: "boolean", default: false },
		},
		strict: true,
	});

	if (!values.input) {
		console.error("Error: --input (-i) is required");
		console.log(VALIDATE_USAGE);
		process.exit(1);
	}

	await validateCommand({
		inputSpec: values.input as string,
		strict: values.strict as boolean,
	});
}

function handleList(args: string[]): void {
	// Check for help
	if (args.includes("-h") || args.includes("--help")) {
		console.log(LIST_USAGE);
		process.exit(0);
	}

	listCommand();
}

/**
 * Parse comma-separated key=value pairs
 */
function parseKeyValuePairs(input: string | undefined): Record<string, string> {
	if (!input) return {};

	const result: Record<string, string> = {};
	const pairs = input.split(",");

	for (const pair of pairs) {
		const [key, ...valueParts] = pair.split("=");
		if (key && valueParts.length > 0) {
			result[key.trim()] = valueParts.join("=").trim();
		}
	}

	return result;
}

// Run the CLI
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
