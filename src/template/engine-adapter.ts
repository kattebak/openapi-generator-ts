/**
 * Template engine adapter for Handlebars
 * Provides a unified interface for template compilation and rendering
 */
import Handlebars from "handlebars";
import type {
	CompiledTemplate,
	TemplateData,
	TemplatingEngine,
} from "../core/types.js";
import { createAllLambdas, type LambdaFunction } from "./lambdas/index.js";

export interface EngineAdapterOptions {
	strict?: boolean;
	preventIndent?: boolean;
}

/**
 * Handlebars-based template engine adapter
 */
export class HandlebarsAdapter implements TemplatingEngine {
	private handlebars: typeof Handlebars;

	constructor(_options: EngineAdapterOptions = {}) {
		// Create isolated Handlebars instance
		this.handlebars = Handlebars.create();

		// Register all lambda functions as helpers
		this.registerLambdas();

		// Register built-in helpers for Mustache compatibility
		this.registerBuiltInHelpers();
	}

	/**
	 * Register all lambda functions as Handlebars helpers
	 */
	private registerLambdas(): void {
		const lambdas = createAllLambdas();

		for (const [name, fn] of Object.entries(lambdas)) {
			this.registerLambdaAsHelper(name, fn);
		}
	}

	/**
	 * Register a lambda function as a block helper
	 * Supports both block and inline usage
	 */
	private registerLambdaAsHelper(name: string, fn: LambdaFunction): void {
		this.handlebars.registerHelper(
			name,
			function (this: unknown, ...args: unknown[]) {
				const options = args.pop() as Handlebars.HelperOptions;

				// Block helper usage: {{#lambda}}content{{/lambda}}
				if (options && typeof options.fn === "function") {
					const content = options.fn(this);
					return fn(content);
				}

				// Inline helper usage: {{lambda arg}}
				if (args.length > 0) {
					return fn(args[0]);
				}

				return "";
			},
		);
	}

	/**
	 * Register built-in helpers for Mustache compatibility
	 */
	private registerBuiltInHelpers(): void {
		// Register 'lambda' namespace for compatibility with Java templates
		// This allows {{lambda.camelcase text}} syntax
		const lambdas = createAllLambdas();
		// Register each lambda under the 'lambda' namespace
		for (const [name, fn] of Object.entries(lambdas)) {
			this.handlebars.registerHelper(
				`lambda.${name}`,
				fn as Handlebars.HelperDelegate,
			);
		}

		// Helper to check if value is truthy (non-empty array, non-null, etc.)
		this.handlebars.registerHelper(
			"if_not_empty",
			function (
				this: unknown,
				value: unknown,
				options: Handlebars.HelperOptions,
			) {
				let isNotEmpty = false;

				if (Array.isArray(value)) {
					isNotEmpty = value.length > 0;
				} else if (typeof value === "object" && value !== null) {
					isNotEmpty = Object.keys(value).length > 0;
				} else {
					isNotEmpty = Boolean(value);
				}

				if (isNotEmpty) {
					return options.fn(this);
				}
				return options.inverse ? options.inverse(this) : "";
			},
		);

		// Helper for unless with empty check
		this.handlebars.registerHelper(
			"unless_empty",
			function (
				this: unknown,
				value: unknown,
				options: Handlebars.HelperOptions,
			) {
				const isEmpty =
					!value ||
					(Array.isArray(value) && value.length === 0) ||
					(typeof value === "object" &&
						Object.keys(value as object).length === 0);
				if (isEmpty) {
					return options.fn(this);
				}
				return options.inverse ? options.inverse(this) : "";
			},
		);

		// Helper for wrapping values in braces - used for JSDoc type annotations
		// Converts Mustache's delimiter-change pattern: {{=<% %>=}}{<%&datatype%>}<%={{ }}=%>
		// to a simple helper call: {{braceWrap datatype}}
		this.handlebars.registerHelper("braceWrap", (value: unknown) => {
			return new Handlebars.SafeString(`{${value ?? ""}}`);
		});

		// Helper for comparing values
		this.handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

		this.handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);

		this.handlebars.registerHelper(
			"gt",
			(a: unknown, b: unknown) => (a as number) > (b as number),
		);

		this.handlebars.registerHelper(
			"lt",
			(a: unknown, b: unknown) => (a as number) < (b as number),
		);

		this.handlebars.registerHelper(
			"gte",
			(a: unknown, b: unknown) => (a as number) >= (b as number),
		);

		this.handlebars.registerHelper(
			"lte",
			(a: unknown, b: unknown) => (a as number) <= (b as number),
		);

		// Helper for logical operators
		this.handlebars.registerHelper("and", (...args: unknown[]) => {
			args.pop(); // Remove options
			return args.every(Boolean);
		});

		this.handlebars.registerHelper("or", (...args: unknown[]) => {
			args.pop(); // Remove options
			return args.some(Boolean);
		});

		this.handlebars.registerHelper("not", (value: unknown) => !value);

		// Helper for array operations
		this.handlebars.registerHelper("length", (value: unknown) => {
			if (Array.isArray(value)) {
				return value.length;
			}
			if (typeof value === "string") {
				return value.length;
			}
			return 0;
		});

		this.handlebars.registerHelper(
			"join",
			(array: unknown[], separator: string) => {
				if (!Array.isArray(array)) return "";
				return array.join(separator);
			},
		);

		// @first and @last context variables are already available in Handlebars
		// but we add explicit helpers for compatibility
		this.handlebars.registerHelper(
			"-first",
			function (this: { "@first"?: boolean }) {
				return this["@first"] === true;
			},
		);

		this.handlebars.registerHelper(
			"-last",
			function (this: { "@last"?: boolean }) {
				return this["@last"] === true;
			},
		);
	}

	/**
	 * Compile a template string
	 */
	compile(source: string): CompiledTemplate {
		const template = this.handlebars.compile(source, {
			strict: false,
			preventIndent: false,
			noEscape: false,
		});

		return (data: TemplateData): string => {
			return template(data);
		};
	}

	/**
	 * Register a custom helper function
	 */
	registerHelper(name: string, fn: (...args: unknown[]) => string): void {
		this.handlebars.registerHelper(name, fn);
	}

	/**
	 * Register a partial template
	 */
	registerPartial(name: string, source: string): void {
		this.handlebars.registerPartial(name, source);
	}

	/**
	 * Unregister a partial template
	 */
	unregisterPartial(name: string): void {
		this.handlebars.unregisterPartial(name);
	}

	/**
	 * Get the underlying Handlebars instance
	 */
	getHandlebars(): typeof Handlebars {
		return this.handlebars;
	}
}

/**
 * Create a new Handlebars adapter with default options
 */
export function createTemplateEngine(
	options?: EngineAdapterOptions,
): HandlebarsAdapter {
	return new HandlebarsAdapter(options);
}
