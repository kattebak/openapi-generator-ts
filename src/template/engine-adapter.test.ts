/**
 * Template Engine Adapter tests
 * Tests for Handlebars template compilation and rendering
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { createTemplateEngine, HandlebarsAdapter } from "./engine-adapter.js";

describe("HandlebarsAdapter", () => {
	describe("createTemplateEngine", () => {
		it("should create a HandlebarsAdapter instance", () => {
			const engine = createTemplateEngine();
			assert.ok(engine instanceof HandlebarsAdapter);
		});
	});

	describe("compile", () => {
		it("should compile and render a simple template", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("Hello, {{name}}!");
			const result = template({ name: "World" });
			assert.strictEqual(result, "Hello, World!");
		});

		it("should handle nested properties", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{user.name}} is {{user.age}} years old",
			);
			const result = template({ user: { name: "John", age: 30 } });
			assert.strictEqual(result, "John is 30 years old");
		});

		it("should handle conditionals", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#if isActive}}Active{{else}}Inactive{{/if}}",
			);

			assert.strictEqual(template({ isActive: true }), "Active");
			assert.strictEqual(template({ isActive: false }), "Inactive");
		});

		it("should handle arrays with each", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{#each items}}{{this}},{{/each}}");
			const result = template({ items: ["a", "b", "c"] });
			assert.strictEqual(result, "a,b,c,");
		});
	});

	describe("string lambda helpers", () => {
		it("should support camelcase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#camelcase}}hello_world{{/camelcase}}",
			);
			const result = template({});
			assert.strictEqual(result, "helloWorld");
		});

		it("should support pascalcase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#pascalcase}}hello_world{{/pascalcase}}",
			);
			const result = template({});
			assert.strictEqual(result, "HelloWorld");
		});

		it("should support snakecase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{#snakecase}}helloWorld{{/snakecase}}");
			const result = template({});
			assert.strictEqual(result, "hello_world");
		});

		it("should support uppercase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{#uppercase}}hello{{/uppercase}}");
			const result = template({});
			assert.strictEqual(result, "HELLO");
		});

		it("should support lowercase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{#lowercase}}HELLO{{/lowercase}}");
			const result = template({});
			assert.strictEqual(result, "hello");
		});

		it("should support kebabcase block helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{#kebabcase}}helloWorld{{/kebabcase}}");
			const result = template({});
			assert.strictEqual(result, "hello-world");
		});
	});

	describe("comparison helpers", () => {
		it("should support eq helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{eq a b}}");

			assert.strictEqual(template({ a: 1, b: 1 }), "true");
			assert.strictEqual(template({ a: 1, b: 2 }), "false");
		});

		it("should support ne helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{ne a b}}");

			assert.strictEqual(template({ a: 1, b: 2 }), "true");
			assert.strictEqual(template({ a: 1, b: 1 }), "false");
		});

		it("should support gt helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{gt a b}}");

			assert.strictEqual(template({ a: 5, b: 3 }), "true");
			assert.strictEqual(template({ a: 3, b: 5 }), "false");
		});

		it("should support lt helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{lt a b}}");

			assert.strictEqual(template({ a: 3, b: 5 }), "true");
			assert.strictEqual(template({ a: 5, b: 3 }), "false");
		});
	});

	describe("logical helpers", () => {
		it("should support and helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{and a b}}");

			assert.strictEqual(template({ a: true, b: true }), "true");
			assert.strictEqual(template({ a: true, b: false }), "false");
			assert.strictEqual(template({ a: false, b: true }), "false");
		});

		it("should support or helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{or a b}}");

			assert.strictEqual(template({ a: true, b: false }), "true");
			assert.strictEqual(template({ a: false, b: true }), "true");
			assert.strictEqual(template({ a: false, b: false }), "false");
		});

		it("should support not helper inline", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{not a}}");

			assert.strictEqual(template({ a: false }), "true");
			assert.strictEqual(template({ a: true }), "false");
		});
	});

	describe("array helpers", () => {
		it("should support length helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile("{{length items}}");

			assert.strictEqual(template({ items: [1, 2, 3] }), "3");
			assert.strictEqual(template({ items: [] }), "0");
		});

		it("should support join helper", () => {
			const engine = createTemplateEngine();
			const template = engine.compile('{{join items ", "}}');

			assert.strictEqual(template({ items: ["a", "b", "c"] }), "a, b, c");
		});
	});

	describe("registerHelper", () => {
		it("should allow registering custom helpers", () => {
			const engine = createTemplateEngine();
			engine.registerHelper("double", (...args: unknown[]) =>
				String(Number(args[0]) * 2),
			);

			const template = engine.compile("{{double num}}");
			assert.strictEqual(template({ num: 5 }), "10");
		});
	});

	describe("registerPartial", () => {
		it("should allow registering and using partials", () => {
			const engine = createTemplateEngine();
			engine.registerPartial("greeting", "Hello, {{name}}!");

			const template = engine.compile("{{> greeting}}");
			assert.strictEqual(template({ name: "World" }), "Hello, World!");
		});

		it("should allow unregistering partials", () => {
			const engine = createTemplateEngine();
			engine.registerPartial("greeting", "Hello, {{name}}!");
			engine.unregisterPartial("greeting");

			// This should throw or return empty since partial is unregistered
			const template = engine.compile("{{> greeting}}");
			assert.throws(() => template({ name: "World" }));
		});
	});

	describe("if_not_empty helper", () => {
		it("should render content for non-empty arrays", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#if_not_empty items}}has items{{else}}empty{{/if_not_empty}}",
			);

			assert.strictEqual(template({ items: [1, 2, 3] }), "has items");
			assert.strictEqual(template({ items: [] }), "empty");
		});

		it("should render content for non-empty objects", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#if_not_empty obj}}has props{{else}}empty{{/if_not_empty}}",
			);

			assert.strictEqual(template({ obj: { a: 1 } }), "has props");
			assert.strictEqual(template({ obj: {} }), "empty");
		});

		it("should render content for truthy values", () => {
			const engine = createTemplateEngine();
			const template = engine.compile(
				"{{#if_not_empty value}}truthy{{else}}falsy{{/if_not_empty}}",
			);

			assert.strictEqual(template({ value: "hello" }), "truthy");
			assert.strictEqual(template({ value: null }), "falsy");
			assert.strictEqual(template({ value: undefined }), "falsy");
		});
	});
});
