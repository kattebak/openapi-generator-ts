/**
 * Indentation lambdas for templates
 */

/**
 * Indent text by specified number of spaces
 */
export function indent(text: string, spaces: number): string {
	const indentation = " ".repeat(spaces);
	return text
		.split("\n")
		.map((line, index) => (index === 0 ? line : indentation + line))
		.join("\n");
}

/**
 * Indent all lines including the first line
 */
export function indentAll(text: string, spaces: number): string {
	const indentation = " ".repeat(spaces);
	return text
		.split("\n")
		.map((line) => indentation + line)
		.join("\n");
}

/**
 * Indent with tabs
 */
export function indentTab(text: string, tabs: number): string {
	const indentation = "\t".repeat(tabs);
	return text
		.split("\n")
		.map((line, index) => (index === 0 ? line : indentation + line))
		.join("\n");
}

/**
 * Trim leading and trailing whitespace
 */
export function trimWhitespace(text: string): string {
	return text.trim();
}

/**
 * Trim trailing whitespace only
 */
export function trimTrailingWhitespace(text: string): string {
	return text
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");
}

/**
 * Trim multiple consecutive line breaks to single
 */
export function trimLineBreaks(text: string): string {
	return text.replace(/\n\n+/g, "\n");
}

/**
 * Remove all line breaks
 */
export function removeLineBreaks(text: string): string {
	return text.replace(/\n/g, "");
}

/**
 * Collapse multiple spaces to single space
 */
export function collapseSpaces(text: string): string {
	return text.replace(/ +/g, " ");
}

/**
 * Create indentation lambdas with common preset values
 */
export function createIndentLambdas(): Record<
	string,
	(text: string) => string
> {
	return {
		// Standard indentation (4 spaces)
		indented: (text: string) => indent(text, 4),
		indented_4: (text: string) => indent(text, 4),
		indented_8: (text: string) => indent(text, 8),
		indented_12: (text: string) => indent(text, 12),
		indented_16: (text: string) => indent(text, 16),

		// 2-space indentation (common in JS/TS)
		indented_2: (text: string) => indent(text, 2),
		indented_6: (text: string) => indent(text, 6),
		indented_10: (text: string) => indent(text, 10),

		// Tab-based indentation
		indented_tab: (text: string) => indentTab(text, 1),
		indented_tab_2: (text: string) => indentTab(text, 2),

		// All lines indentation
		indented_all_4: (text: string) => indentAll(text, 4),
		indented_all_8: (text: string) => indentAll(text, 8),

		// Whitespace manipulation
		trimWhitespace,
		trim: trimWhitespace,
		trimTrailingWhitespace,
		trimTrailing: trimTrailingWhitespace,
		trimLineBreaks,
		removeLineBreaks,
		collapseSpaces,
	};
}
