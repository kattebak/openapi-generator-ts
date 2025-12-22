/**
 * String lambda tests
 * Tests for string transformation functions
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	backslash,
	camelcase,
	capitalizeFirst,
	createStringLambdas,
	doublequote,
	escapeDoubleQuotes,
	escapeSingleQuotes,
	forwardslash,
	kebabcase,
	lowercase,
	lowercaseFirst,
	pascalcase,
	removeSpecialChars,
	screamingSnakecase,
	singlequote,
	snakecase,
	titlecase,
	uncamelize,
	uppercase,
} from "./string-lambdas.js";

describe("String Lambdas", () => {
	describe("lowercase", () => {
		it("should convert to lowercase", () => {
			assert.strictEqual(lowercase("HELLO"), "hello");
			assert.strictEqual(lowercase("Hello World"), "hello world");
			assert.strictEqual(lowercase("already lowercase"), "already lowercase");
		});
	});

	describe("uppercase", () => {
		it("should convert to uppercase", () => {
			assert.strictEqual(uppercase("hello"), "HELLO");
			assert.strictEqual(uppercase("Hello World"), "HELLO WORLD");
			assert.strictEqual(uppercase("ALREADY UPPERCASE"), "ALREADY UPPERCASE");
		});
	});

	describe("camelcase", () => {
		it("should convert to camelCase", () => {
			assert.strictEqual(camelcase("hello_world"), "helloWorld");
			assert.strictEqual(camelcase("hello-world"), "helloWorld");
			assert.strictEqual(camelcase("HelloWorld"), "helloWorld");
			assert.strictEqual(camelcase("HELLO_WORLD"), "helloWorld");
		});
	});

	describe("pascalcase", () => {
		it("should convert to PascalCase", () => {
			assert.strictEqual(pascalcase("hello_world"), "HelloWorld");
			assert.strictEqual(pascalcase("hello-world"), "HelloWorld");
			assert.strictEqual(pascalcase("helloWorld"), "HelloWorld");
			assert.strictEqual(pascalcase("HELLO_WORLD"), "HelloWorld");
		});
	});

	describe("snakecase", () => {
		it("should convert to snake_case", () => {
			assert.strictEqual(snakecase("helloWorld"), "hello_world");
			assert.strictEqual(snakecase("HelloWorld"), "hello_world");
			assert.strictEqual(snakecase("hello-world"), "hello_world");
			assert.strictEqual(snakecase("HELLO_WORLD"), "hello_world");
		});
	});

	describe("screamingSnakecase", () => {
		it("should convert to SCREAMING_SNAKE_CASE", () => {
			assert.strictEqual(screamingSnakecase("helloWorld"), "HELLO_WORLD");
			assert.strictEqual(screamingSnakecase("HelloWorld"), "HELLO_WORLD");
			assert.strictEqual(screamingSnakecase("hello-world"), "HELLO_WORLD");
			assert.strictEqual(screamingSnakecase("hello_world"), "HELLO_WORLD");
		});
	});

	describe("kebabcase", () => {
		it("should convert to kebab-case", () => {
			assert.strictEqual(kebabcase("helloWorld"), "hello-world");
			assert.strictEqual(kebabcase("HelloWorld"), "hello-world");
			assert.strictEqual(kebabcase("hello_world"), "hello-world");
			assert.strictEqual(kebabcase("HELLO_WORLD"), "hello-world");
		});
	});

	describe("titlecase", () => {
		it("should convert to Title Case", () => {
			assert.strictEqual(titlecase("helloWorld"), "Hello World");
			assert.strictEqual(titlecase("hello_world"), "Hello World");
		});
	});

	describe("capitalizeFirst", () => {
		it("should capitalize first letter", () => {
			assert.strictEqual(capitalizeFirst("hello"), "Hello");
			assert.strictEqual(capitalizeFirst("HELLO"), "Hello");
			assert.strictEqual(capitalizeFirst("hello world"), "Hello world");
		});
	});

	describe("lowercaseFirst", () => {
		it("should lowercase first letter", () => {
			assert.strictEqual(lowercaseFirst("Hello"), "hello");
			assert.strictEqual(lowercaseFirst("HELLO"), "hELLO");
			assert.strictEqual(lowercaseFirst("Hello World"), "hello World");
		});

		it("should handle empty string", () => {
			assert.strictEqual(lowercaseFirst(""), "");
		});
	});

	describe("uncamelize", () => {
		it("should separate camelCase words with spaces", () => {
			assert.strictEqual(uncamelize("camelCaseText"), "camel Case Text");
			assert.strictEqual(uncamelize("HelloWorld"), "Hello World");
		});
	});

	describe("removeSpecialChars", () => {
		it("should remove special characters", () => {
			assert.strictEqual(removeSpecialChars("hello-world"), "helloworld");
			assert.strictEqual(removeSpecialChars("hello@world!"), "helloworld");
			assert.strictEqual(
				removeSpecialChars("hello_world123"),
				"hello_world123",
			);
		});
	});

	describe("doublequote", () => {
		it("should wrap text in double quotes", () => {
			assert.strictEqual(doublequote("hello"), '"hello"');
			assert.strictEqual(doublequote("hello world"), '"hello world"');
		});
	});

	describe("singlequote", () => {
		it("should wrap text in single quotes", () => {
			assert.strictEqual(singlequote("hello"), "'hello'");
			assert.strictEqual(singlequote("hello world"), "'hello world'");
		});
	});

	describe("escapeDoubleQuotes", () => {
		it("should escape double quotes", () => {
			assert.strictEqual(escapeDoubleQuotes('say "hello"'), 'say \\"hello\\"');
			assert.strictEqual(escapeDoubleQuotes("no quotes"), "no quotes");
		});
	});

	describe("escapeSingleQuotes", () => {
		it("should escape single quotes", () => {
			assert.strictEqual(escapeSingleQuotes("it's"), "it\\'s");
			assert.strictEqual(escapeSingleQuotes("no quotes"), "no quotes");
		});
	});

	describe("forwardslash", () => {
		it("should replace backslashes with forward slashes", () => {
			assert.strictEqual(forwardslash("path\\to\\file"), "path/to/file");
			assert.strictEqual(forwardslash("no/backslashes"), "no/backslashes");
		});
	});

	describe("backslash", () => {
		it("should replace forward slashes with backslashes", () => {
			assert.strictEqual(backslash("path/to/file"), "path\\to\\file");
			assert.strictEqual(
				backslash("no\\forward\\slashes"),
				"no\\forward\\slashes",
			);
		});
	});

	describe("createStringLambdas", () => {
		it("should return all lambda functions", () => {
			const lambdas = createStringLambdas();

			assert.ok(typeof lambdas.lowercase === "function");
			assert.ok(typeof lambdas.uppercase === "function");
			assert.ok(typeof lambdas.camelcase === "function");
			assert.ok(typeof lambdas.camelCase === "function");
			assert.ok(typeof lambdas.pascalcase === "function");
			assert.ok(typeof lambdas.pascalCase === "function");
			assert.ok(typeof lambdas.snakecase === "function");
			assert.ok(typeof lambdas.snake_case === "function");
			assert.ok(typeof lambdas.kebabcase === "function");
			assert.ok(typeof lambdas["kebab-case"] === "function");
		});

		it("should have alias functions that work correctly", () => {
			const lambdas = createStringLambdas();

			// Test that aliases work the same as originals
			assert.strictEqual(
				lambdas.camelcase("hello_world"),
				lambdas.camelCase("hello_world"),
			);
			assert.strictEqual(
				lambdas.pascalcase("hello_world"),
				lambdas.pascalCase("hello_world"),
			);
			assert.strictEqual(
				lambdas.snakecase("helloWorld"),
				lambdas.snake_case("helloWorld"),
			);
		});
	});
});
