#!/usr/bin/env node
/**
 * Mustache to Handlebars Template Converter
 *
 * Converts OpenAPI Generator Mustache templates to Handlebars-compatible format.
 *
 * Handlebars is largely compatible with Mustache, but there are a few key differences:
 *
 * 1. Delimiter changes ({{=<% %>=}}) are NOT supported in Handlebars
 *    - These are converted to helper calls or removed
 *
 * 2. The {{#lambda.xxx}}...{{/lambda.xxx}} pattern becomes {{#xxx}}...{{/xxx}}
 *    - Lambda helpers are registered in the engine adapter
 *
 * 3. Array index access like foo.0.bar needs bracket notation: foo.[0].bar
 *    - Handlebars requires this for numeric keys
 *
 * Most other Mustache syntax works identically in Handlebars:
 * - {{var}} - escaped output
 * - {{{var}}} - unescaped output
 * - {{#section}}...{{/section}} - block sections
 * - {{^inverted}}...{{/inverted}} - inverted sections
 * - {{>partial}} - partials
 * - {{!comment}} - comments
 */

import { readFileSync } from "node:fs";

/**
 * Convert a Mustache template to Handlebars-compatible format
 * Uses simple regex-based transformations for reliability
 */
export function convertTemplate(content: string): string {
	let result = content;

	// 1. Handle delimiter-change pattern for JSDoc types
	// Pattern: {{=<% %>=}}{<%&varname%>}<%={{ }}=%>
	// This outputs literal { } around a variable value
	// Convert to: {{braceWrap varname}}
	result = result.replace(
		/\{\{=<% %>=\}\}\{<%&(\w+)%>\}<%=\{\{ \}\}=%>/g,
		"{{braceWrap $1}}",
	);

	// 2. Handle delimiter-change pattern for @param tags (similar but with different context)
	// Pattern: {{=<% %>=}}{<%&dataType%>}<%={{ }}=%>
	// Already covered by the above regex

	// 3. Remove any remaining standalone delimiter changes
	// These switch delimiters but the tokenizer should handle them
	// {{=<% %>=}} or <%={{ }}=%>
	result = result.replace(/\{\{=<% %>=\}\}/g, "");
	result = result.replace(/<%=\{\{ \}\}=%>/g, "");

	// 4. Handle any remaining alternate delimiter variables that weren't part of the pattern
	// <%varname%> -> {{varname}}
	result = result.replace(/<%(\w+)%>/g, "{{$1}}");
	// <%&varname%> -> {{{varname}}}
	result = result.replace(/<%&(\w+)%>/g, "{{{$1}}}");

	// 5. Convert lambda block helpers: {{#lambda.xxx}} -> {{#xxx}}
	result = result.replace(/\{\{#lambda\.(\w+)\}\}/g, "{{#$1}}");
	result = result.replace(/\{\{\/lambda\.(\w+)\}\}/g, "{{/$1}}");

	// 6. Convert lambda inline helpers: {{lambda.xxx arg}} -> {{xxx arg}}
	// This handles cases like {{lambda.lowercase name}}
	result = result.replace(/\{\{lambda\.(\w+)\s+/g, "{{$1 ");

	// 7. Convert array index access: foo.0.bar -> foo.[0].bar
	// Look for patterns like .0. or .0}} or .0}}}
	result = result.replace(/\.(\d+)\./g, ".[$1].");
	result = result.replace(/\.(\d+)\}\}/g, ".[$1]}}");
	result = result.replace(/\.(\d+)\}\}\}/g, ".[$1]}}}");

	// 8. Convert array-as-boolean check: {{#varname.[0]}}...{{/varname.[0]}}
	// In Mustache, this enters a block if the first element exists but context is still parent.
	// In Handlebars, the context changes to the first element, breaking inner {{#varname}} refs.
	// Convert to {{#if varname}}...{{/if}} which preserves context and checks array truthiness.
	// Also handle the inverted version {{^varname.[0]}}...{{/varname.[0]}}
	result = result.replace(/\{\{#(\w+)\.\[0\]\}\}/g, "{{#if $1}}");
	result = result.replace(/\{\{\/(\w+)\.\[0\]\}\}/g, "{{/if}}");
	result = result.replace(/\{\{\^(\w+)\.\[0\]\}\}/g, "{{#unless $1}}");

	// 9. Convert string-as-boolean sections to {{#if}} blocks
	// In Mustache, {{#stringVar}}...{{/stringVar}} checks truthiness but keeps parent context.
	// In Handlebars, it changes context to the string value, breaking sibling variable access.
	// Convert known string variables to {{#if}} to preserve context.
	//
	// Note: Both {{#var}} and {{^var}} use {{/var}} as closing in Mustache.
	// In Handlebars, we need {{/if}} for {{#if}} and {{/unless}} for {{#unless}}.
	// So we process inverted sections first as complete pairs, then process normal sections.
	const stringVars = [
		"returnType",
		"returnBaseType",
		"summary",
		"notes",
		"description",
		"unescapedDescription",
		"externalDocsDescription",
		"externalDocsUrl",
		"basePath",
		"host",
		"title",
		"appDescription",
		"appDescriptionWithNewLines",
		"appName",
		"infoUrl",
		"infoEmail",
		"version",
		"termsOfService",
		"licenseName",
		"licenseUrl",
		"licenseInfo",
		"appContact",
		"returnContainer",
		"defaultValue",
		"dataFormat",
		"example",
		"exampleValue",
		// Note: bodyParam is an object, NOT a string - do not add here
		// Note: vendorExtensions is also an object
		"pattern",
		"minimum",
		"maximum",
		"minLength",
		"maxLength",
	];
	for (const varName of stringVars) {
		// First, handle the special case where {{{.}}} or {{.}} is used inside the block
		// This pattern is common in Mustache: {{#varName}}{{{.}}}{{/varName}}
		// The . refers to the current context (the varName value)
		// Convert to: {{{varName}}} directly
		result = result.replace(
			new RegExp(
				`\\{\\{#${varName}\\}\\}\\{\\{\\{\\.\\}\\}\\}\\{\\{/${varName}\\}\\}`,
				"g",
			),
			`{{{${varName}}}}`,
		);
		result = result.replace(
			new RegExp(
				`\\{\\{#${varName}\\}\\}\\{\\{\\.\\}\\}\\{\\{/${varName}\\}\\}`,
				"g",
			),
			`{{${varName}}}`,
		);

		// Handle patterns with surrounding text: {{#varName}}prefix {{{.}}} suffix{{/varName}}
		// Convert to: {{#if varName}}prefix {{{varName}}} suffix{{/if}}
		result = result.replace(
			new RegExp(
				`\\{\\{#${varName}\\}\\}([^{]*)\\{\\{\\{\\.\\}\\}\\}([^{]*)\\{\\{/${varName}\\}\\}`,
				"g",
			),
			`{{#if ${varName}}}$1{{{${varName}}}}$2{{/if}}`,
		);
		result = result.replace(
			new RegExp(
				`\\{\\{#${varName}\\}\\}([^{]*)\\{\\{\\.\\}\\}([^{]*)\\{\\{/${varName}\\}\\}`,
				"g",
			),
			`{{#if ${varName}}}$1{{${varName}}}$2{{/if}}`,
		);

		// Then convert inverted sections as complete pairs
		// {{^varName}}...{{/varName}} -> {{#unless varName}}...{{/unless}}
		// Use non-greedy match to handle nested sections correctly
		result = result.replace(
			new RegExp(
				`\\{\\{\\^${varName}\\}\\}([\\s\\S]*?)\\{\\{/${varName}\\}\\}`,
				"g",
			),
			`{{#unless ${varName}}}$1{{/unless}}`,
		);
		// Then convert remaining normal sections with dot reference replacement
		// {{#varName}}...{{{.}}}...{{/varName}} -> {{#if varName}}...{{{varName}}}...{{/if}}
		// We need to replace {{{.}}} and {{.}} with the varName inside the block
		// Run iteratively because nested blocks need multiple passes
		let prevResult = "";
		while (prevResult !== result) {
			prevResult = result;
			result = result.replace(
				new RegExp(
					`\\{\\{#${varName}\\}\\}([\\s\\S]*?)\\{\\{/${varName}\\}\\}`,
					"g",
				),
				(_, content) => {
					// Replace dot references with the variable name inside the block
					const replaced = content
						.replace(/\{\{\{\.\}\}\}/g, `{{{${varName}}}}`)
						.replace(/\{\{\.\}\}/g, `{{${varName}}}`);
					return `{{#if ${varName}}}${replaced}{{/if}}`;
				},
			);
		}
	}

	// 10. Handle -first and -last in iteration contexts
	// Process inverted sections FIRST as complete pairs (they use {{/-first}} as close tag too)
	// {{^-first}}...{{/-first}} -> {{#unless @first}}...{{/unless}}
	result = result.replace(
		/\{\{\^-first\}\}([\s\S]*?)\{\{\/-first\}\}/g,
		"{{#unless @first}}$1{{/unless}}",
	);
	result = result.replace(
		/\{\{\^-last\}\}([\s\S]*?)\{\{\/-last\}\}/g,
		"{{#unless @last}}$1{{/unless}}",
	);

	// Then process regular sections
	// {{#-first}}...{{/-first}} -> {{#if @first}}...{{/if}}
	result = result.replace(/\{\{#-first\}\}/g, "{{#if @first}}");
	result = result.replace(/\{\{\/-first\}\}/g, "{{/if}}");
	result = result.replace(/\{\{#-last\}\}/g, "{{#if @last}}");
	result = result.replace(/\{\{\/-last\}\}/g, "{{/if}}");

	// 11. Fix ambiguous }}} sequences after block tags that could confuse Handlebars
	// When a block tag like {{#if ...}} or {{/if}} is followed immediately by }
	// (which is code output, not template), Handlebars parser may get confused.
	// Add whitespace to disambiguate: {{#if foo}}} -> {{#if foo}} }
	// Pattern: Match {{...}} where ... doesn't start with { (not unescaped output)
	// followed by } that isn't part of another tag
	result = result.replace(/(\{\{[#^\/][\w@\s]+\}\})\}([^}])/g, "$1 }$2");

	return result;
}

/**
 * Process a single file - reads from path, outputs converted content to stdout
 */
function processFile(inputPath: string): void {
	const content = readFileSync(inputPath, "utf-8");
	const converted = convertTemplate(content);
	process.stdout.write(converted);
}

// CLI handling
function main(): void {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		console.log(`
Mustache to Handlebars Template Converter

Usage:
  npx tsx src/cli/convert-template.ts <input-file>

The converted template is written to stdout.

Examples:
  npx tsx src/cli/convert-template.ts template.mustache
  npx tsx src/cli/convert-template.ts template.mustache > output.mustache
`);
		process.exit(0);
	}

	processFile(args[0]);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
