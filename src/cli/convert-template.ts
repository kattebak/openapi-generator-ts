#!/usr/bin/env node
/**
 * Mustache to Handlebars Template Converter
 *
 * Converts OpenAPI Generator Mustache templates to Handlebars-compatible format.
 * Uses a tokenizer pattern for robust handling of edge cases.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { extname, join } from "path";

// Token types
type TokenType =
	| "text"
	| "variable" // {{var}}
	| "unescaped" // {{{var}}} or {{&var}}
	| "section_open" // {{#var}}
	| "section_close" // {{/var}}
	| "inverted" // {{^var}}
	| "partial" // {{>partial}}
	| "comment" // {{!comment}}
	| "delimiter_change" // {{=<% %>=}}
	| "alt_variable" // <%var%> or <%&var%>
	| "alt_unescaped"; // <%&var%>

interface Token {
	type: TokenType;
	value: string;
	raw: string;
	unescaped?: boolean;
}

interface ConversionContext {
	depth: number;
	blockStack: string[];
	currentDelimiters: [string, string];
}

/**
 * Known string-type variables that should use {{#if}} instead of {{#}}
 * These are variables that contain string values, not objects/arrays
 */
const STRING_CONDITIONALS = new Set([
	"returnType",
	"returnBaseType",
	"dataType",
	"baseType",
	"description",
	"summary",
	"notes",
	"title",
	"example",
	"defaultValue",
	"pattern",
	"minimum",
	"maximum",
	"format",
	"parent",
	"discriminator",
]);

/**
 * Variables that are objects/arrays and should keep {{#}} syntax
 */
const BLOCK_VARIABLES = new Set([
	"operations",
	"operation",
	"allParams",
	"pathParams",
	"queryParams",
	"headerParams",
	"bodyParams",
	"formParams",
	"vars",
	"allVars",
	"requiredVars",
	"optionalVars",
	"readOnlyVars",
	"readWriteVars",
	"responses",
	"successResponses",
	"errorResponses",
	"imports",
	"models",
	"authMethods",
	"servers",
	"tags",
	"enumVars",
	"allowableValues",
	"consumes",
	"produces",
]);

/**
 * Tokenize a Mustache template
 */
function tokenize(template: string): Token[] {
	const tokens: Token[] = [];
	let pos = 0;
	let openDelim = "{{";
	let closeDelim = "}}";

	while (pos < template.length) {
		// Check for delimiter change
		const delimMatch = template
			.slice(pos)
			.match(/^\{\{=\s*(\S+)\s+(\S+)\s*=\}\}/);
		if (delimMatch) {
			tokens.push({
				type: "delimiter_change",
				value: `${delimMatch[1]} ${delimMatch[2]}`,
				raw: delimMatch[0],
			});
			openDelim = delimMatch[1];
			closeDelim = delimMatch[2];
			pos += delimMatch[0].length;
			continue;
		}

		// Check for switch back to standard delimiters
		const switchBackMatch = template.slice(pos).match(/^<%=\{\{ \}\}=%>/);
		if (switchBackMatch) {
			tokens.push({
				type: "delimiter_change",
				value: "{{ }}",
				raw: switchBackMatch[0],
			});
			openDelim = "{{";
			closeDelim = "}}";
			pos += switchBackMatch[0].length;
			continue;
		}

		// Check for alternate delimiter variable (unescaped)
		if (openDelim === "<%") {
			const altUnescapedMatch = template.slice(pos).match(/^<%&(\w+)%>/);
			if (altUnescapedMatch) {
				tokens.push({
					type: "alt_unescaped",
					value: altUnescapedMatch[1],
					raw: altUnescapedMatch[0],
					unescaped: true,
				});
				pos += altUnescapedMatch[0].length;
				continue;
			}

			const altVarMatch = template.slice(pos).match(/^<%(\w+)%>/);
			if (altVarMatch) {
				tokens.push({
					type: "alt_variable",
					value: altVarMatch[1],
					raw: altVarMatch[0],
				});
				pos += altVarMatch[0].length;
				continue;
			}
		}

		// Check for standard Mustache tags
		const tagStart = template.indexOf(openDelim, pos);

		if (tagStart === -1 || tagStart > pos) {
			// Text before next tag (or rest of template)
			const textEnd = tagStart === -1 ? template.length : tagStart;
			if (textEnd > pos) {
				tokens.push({
					type: "text",
					value: template.slice(pos, textEnd),
					raw: template.slice(pos, textEnd),
				});
			}
			if (tagStart === -1) break;
			pos = tagStart;
			continue;
		}

		// Find closing delimiter
		const tagEndStart = template.indexOf(closeDelim, pos + openDelim.length);
		if (tagEndStart === -1) {
			// No closing delimiter, treat as text
			tokens.push({
				type: "text",
				value: template.slice(pos),
				raw: template.slice(pos),
			});
			break;
		}

		const tagContent = template.slice(pos + openDelim.length, tagEndStart);
		const fullTag = template.slice(pos, tagEndStart + closeDelim.length);

		// Check for triple mustache (unescaped)
		if (
			openDelim === "{{" &&
			template[pos + 2] === "{" &&
			template[tagEndStart + 2] === "}"
		) {
			const innerContent = template.slice(pos + 3, tagEndStart);
			tokens.push({
				type: "unescaped",
				value: innerContent.trim(),
				raw: template.slice(pos, tagEndStart + 3),
				unescaped: true,
			});
			pos = tagEndStart + 3;
			continue;
		}

		// Parse tag type
		const firstChar = tagContent[0];
		const restContent = tagContent.slice(1).trim();

		switch (firstChar) {
			case "#":
				tokens.push({
					type: "section_open",
					value: restContent,
					raw: fullTag,
				});
				break;
			case "/":
				tokens.push({
					type: "section_close",
					value: restContent,
					raw: fullTag,
				});
				break;
			case "^":
				tokens.push({
					type: "inverted",
					value: restContent,
					raw: fullTag,
				});
				break;
			case ">":
				tokens.push({
					type: "partial",
					value: restContent,
					raw: fullTag,
				});
				break;
			case "!":
				tokens.push({
					type: "comment",
					value: restContent,
					raw: fullTag,
				});
				break;
			case "&":
				tokens.push({
					type: "unescaped",
					value: restContent,
					raw: fullTag,
					unescaped: true,
				});
				break;
			default:
				tokens.push({
					type: "variable",
					value: tagContent.trim(),
					raw: fullTag,
				});
		}

		pos = tagEndStart + closeDelim.length;
	}

	return tokens;
}

/**
 * Check if a variable name should use {{#if}} instead of {{#}}
 */
function shouldUseIfConditional(varName: string): boolean {
	// Handle dotted paths like "lambda.X" or "array.0"
	const baseName = varName.split(".")[0];

	// Array existence check pattern: array.0
	if (/^\w+\.0$/.test(varName)) {
		return true;
	}

	// Lambda pattern: lambda.X
	if (varName.startsWith("lambda.")) {
		return false; // These become helper calls
	}

	// Known string conditionals
	if (STRING_CONDITIONALS.has(baseName)) {
		return true;
	}

	// Known block variables should NOT use if
	if (BLOCK_VARIABLES.has(baseName)) {
		return false;
	}

	// Boolean-like names typically should not use if (they're already boolean)
	if (
		varName.startsWith("is") ||
		varName.startsWith("has") ||
		varName.startsWith("with") ||
		varName.startsWith("use")
	) {
		return false;
	}

	// Default: assume it's a potential string conditional
	return false;
}

/**
 * Convert tokens to Handlebars-compatible output
 */
function convertToHandlebars(tokens: Token[]): string {
	const output: string[] = [];
	const context: ConversionContext = {
		depth: 0,
		blockStack: [],
		currentDelimiters: ["{{", "}}"],
	};

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		switch (token.type) {
			case "text":
				output.push(token.value);
				break;

			case "delimiter_change":
				// Skip delimiter changes - Handlebars doesn't support them
				// The tokenizer already handled the delimiter state
				break;

			case "alt_unescaped":
			case "alt_variable":
				// Convert alternate delimiter variables to triple braces
				output.push(`{{{${token.value}}}}`);
				break;

			case "variable":
				// Handle lambda syntax: {{lambda.X}} -> {{X}}
				if (token.value.startsWith("lambda.")) {
					const helperName = token.value.slice(7);
					output.push(`{{${helperName}}}`);
				} else {
					output.push(`{{${token.value}}}`);
				}
				break;

			case "unescaped":
				output.push(`{{{${token.value}}}}`);
				break;

			case "section_open": {
				const varName = token.value;
				context.blockStack.push(varName);
				context.depth++;

				// Handle array.0 pattern (check if array is non-empty)
				if (/^\w+\.0$/.test(varName)) {
					const arrayName = varName.split(".")[0];
					output.push(`{{#if ${arrayName}}}`);
				}
				// Handle lambda.X pattern (block helper)
				else if (varName.startsWith("lambda.")) {
					const helperName = varName.slice(7);
					output.push(`{{#${helperName}}}`);
				}
				// Check if this is a string conditional that needs {{#if}}
				else if (shouldUseIfConditional(varName)) {
					output.push(`{{#if ${varName}}}`);
				} else {
					output.push(`{{#${varName}}}`);
				}
				break;
			}

			case "section_close": {
				const varName = token.value;
				const openingTag = context.blockStack.pop();
				const wasInverted = openingTag?.startsWith("^");
				context.depth--;

				// Handle array.0 pattern
				if (/^\w+\.0$/.test(varName)) {
					output.push(wasInverted ? `{{/unless}}` : `{{/if}}`);
				}
				// Handle lambda.X pattern
				else if (varName.startsWith("lambda.")) {
					const helperName = varName.slice(7);
					output.push(`{{/${helperName}}}`);
				}
				// Match the opening tag type
				else if (shouldUseIfConditional(varName)) {
					output.push(wasInverted ? `{{/unless}}` : `{{/if}}`);
				} else {
					output.push(`{{/${varName}}}`);
				}
				break;
			}

			case "inverted": {
				const varName = token.value;

				// Handle array.0 pattern
				if (/^\w+\.0$/.test(varName)) {
					const arrayName = varName.split(".")[0];
					output.push(`{{#unless ${arrayName}}}`);
				}
				// Check if this is a string conditional
				else if (shouldUseIfConditional(varName)) {
					output.push(`{{#unless ${varName}}}`);
				} else {
					output.push(`{{^${varName}}}`);
				}

				// Track for proper closing
				context.blockStack.push(`^${varName}`);
				context.depth++;
				break;
			}

			case "partial":
				output.push(`{{>${token.value}}}`);
				break;

			case "comment":
				output.push(`{{!${token.value}}}`);
				break;
		}
	}

	return output.join("");
}

/**
 * Convert a single template file
 */
function convertTemplate(content: string): string {
	const tokens = tokenize(content);
	return convertToHandlebars(tokens);
}

/**
 * Process a single file
 */
function processFile(inputPath: string, outputPath?: string): void {
	const content = readFileSync(inputPath, "utf-8");
	const converted = convertTemplate(content);

	if (outputPath) {
		writeFileSync(outputPath, converted);
		console.log(`Converted: ${inputPath} -> ${outputPath}`);
	} else {
		console.log(converted);
	}
}

/**
 * Process a directory recursively
 */
function processDirectory(
	inputDir: string,
	outputDir: string,
	extensions = [".mustache"],
): void {
	const entries = readdirSync(inputDir);

	for (const entry of entries) {
		const inputPath = join(inputDir, entry);
		const outputPath = join(outputDir, entry);
		const stat = statSync(inputPath);

		if (stat.isDirectory()) {
			processDirectory(inputPath, outputPath, extensions);
		} else if (extensions.includes(extname(entry))) {
			processFile(inputPath, outputPath);
		}
	}
}

// CLI handling
function main(): void {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		console.log(`
Mustache to Handlebars Template Converter

Usage:
  npx tsx src/cli/convert-template.ts <input> [output]
  npx tsx src/cli/convert-template.ts --dir <input-dir> <output-dir>

Options:
  --dir           Process entire directory recursively
  --ext <exts>    File extensions to process (default: .mustache)
  -h, --help      Show this help message

Examples:
  # Convert single file to stdout
  npx tsx src/cli/convert-template.ts template.mustache

  # Convert single file to output file
  npx tsx src/cli/convert-template.ts input.mustache output.mustache

  # Convert directory
  npx tsx src/cli/convert-template.ts --dir ./input-templates ./output-templates
`);
		process.exit(0);
	}

	if (args[0] === "--dir") {
		if (args.length < 3) {
			console.error("Error: --dir requires input and output directories");
			process.exit(1);
		}
		processDirectory(args[1], args[2]);
	} else {
		processFile(args[0], args[1]);
	}
}

// Export for testing
export {
	tokenize,
	convertTemplate,
	convertToHandlebars,
	type Token,
	type TokenType,
};

// Run if called directly
main();
