/**
 * Lambda functions for template processing
 * These are registered as Handlebars helpers
 */

import { createIndentLambdas } from "./indent-lambdas.js";
import { createStringLambdas } from "./string-lambdas.js";

export * from "./indent-lambdas.js";
export * from "./string-lambdas.js";

/**
 * Special purpose lambdas
 */

/**
 * Join array elements with separator
 */
export function joinWithComma(items: unknown[]): string {
	return items.map(String).join(", ");
}

/**
 * Join array elements with newlines
 */
export function joinWithNewline(items: unknown[]): string {
	return items.map(String).join("\n");
}

/**
 * Check if array/object is not empty
 */
export function hasItems(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	if (typeof value === "object" && value !== null) {
		return Object.keys(value).length > 0;
	}
	return false;
}

/**
 * Get the first item of an array
 */
export function first<T>(items: T[]): T | undefined {
	return items[0];
}

/**
 * Get the last item of an array
 */
export function last<T>(items: T[]): T | undefined {
	return items[items.length - 1];
}

/**
 * Required parameter lambda - removes trailing '?' from optional params
 * Matches Java's RequiredParameterLambda behavior
 */
export function requiredParameter(text: string): string {
	return text.endsWith("?") ? text.slice(0, -1) : text;
}

/**
 * Optional parameter lambda - adds trailing '?' if not present
 */
export function optionalParameter(text: string): string {
	return text.endsWith("?") ? text : `${text}?`;
}

// biome-ignore lint/suspicious/noExplicitAny: Lambda functions need to accept any arguments
export type LambdaFunction = (...args: any[]) => unknown;

/**
 * Create all lambda functions for template registration
 */
export function createAllLambdas(): Record<string, LambdaFunction> {
	const stringLambdas = createStringLambdas();
	const indentLambdas = createIndentLambdas();

	return {
		...stringLambdas,
		...indentLambdas,
		joinWithComma: joinWithComma as LambdaFunction,
		joinWithNewline: joinWithNewline as LambdaFunction,
		hasItems: hasItems as LambdaFunction,
		first: first as LambdaFunction,
		last: last as LambdaFunction,
		requiredParameter: requiredParameter as LambdaFunction,
		optionalParameter: optionalParameter as LambdaFunction,
	};
}
