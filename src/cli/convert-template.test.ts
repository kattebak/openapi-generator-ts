import assert from "node:assert";
import { describe, it } from "node:test";
import { convertTemplate, tokenize } from "./convert-template.js";

describe("Template Converter", () => {
	describe("tokenize", () => {
		it("should tokenize simple variables", () => {
			const tokens = tokenize("Hello {{name}}!");
			assert.strictEqual(tokens.length, 3);
			assert.strictEqual(tokens[0].type, "text");
			assert.strictEqual(tokens[0].value, "Hello ");
			assert.strictEqual(tokens[1].type, "variable");
			assert.strictEqual(tokens[1].value, "name");
			assert.strictEqual(tokens[2].type, "text");
			assert.strictEqual(tokens[2].value, "!");
		});

		it("should tokenize triple mustache (unescaped)", () => {
			const tokens = tokenize("{{{html}}}");
			assert.strictEqual(tokens.length, 1);
			assert.strictEqual(tokens[0].type, "unescaped");
			assert.strictEqual(tokens[0].value, "html");
		});

		it("should tokenize ampersand unescaped", () => {
			const tokens = tokenize("{{&html}}");
			assert.strictEqual(tokens.length, 1);
			assert.strictEqual(tokens[0].type, "unescaped");
			assert.strictEqual(tokens[0].value, "html");
		});

		it("should tokenize section tags", () => {
			const tokens = tokenize("{{#items}}{{name}}{{/items}}");
			assert.strictEqual(tokens.length, 3);
			assert.strictEqual(tokens[0].type, "section_open");
			assert.strictEqual(tokens[0].value, "items");
			assert.strictEqual(tokens[1].type, "variable");
			assert.strictEqual(tokens[2].type, "section_close");
		});

		it("should tokenize inverted sections", () => {
			const tokens = tokenize("{{^items}}No items{{/items}}");
			assert.strictEqual(tokens.length, 3);
			assert.strictEqual(tokens[0].type, "inverted");
			assert.strictEqual(tokens[0].value, "items");
		});

		it("should tokenize partials", () => {
			const tokens = tokenize("{{>header}}");
			assert.strictEqual(tokens.length, 1);
			assert.strictEqual(tokens[0].type, "partial");
			assert.strictEqual(tokens[0].value, "header");
		});

		it("should tokenize comments", () => {
			const tokens = tokenize("{{! This is a comment }}");
			assert.strictEqual(tokens.length, 1);
			assert.strictEqual(tokens[0].type, "comment");
		});

		it("should handle delimiter changes", () => {
			const tokens = tokenize("{{=<% %>=}}<%var%><%={{ }}=%>{{var}}");
			// Should have: delimiter_change, alt_variable, delimiter_change, variable
			const types = tokens.map((t) => t.type);
			assert.ok(types.includes("delimiter_change"));
			assert.ok(types.includes("alt_variable"));
			assert.ok(types.includes("variable"));
		});

		it("should tokenize alternate delimiter unescaped", () => {
			const tokens = tokenize("{{=<% %>=}}<%&datatype%>");
			const altToken = tokens.find((t) => t.type === "alt_unescaped");
			assert.ok(altToken);
			assert.strictEqual(altToken?.value, "datatype");
		});
	});

	describe("convertTemplate", () => {
		it("should pass through simple variables", () => {
			const result = convertTemplate("{{name}}");
			assert.strictEqual(result, "{{name}}");
		});

		it("should preserve triple mustache", () => {
			const result = convertTemplate("{{{html}}}");
			assert.strictEqual(result, "{{{html}}}");
		});

		it("should convert alternate delimiter variables to triple braces", () => {
			const result = convertTemplate("{{=<% %>=}}<%&datatype%>");
			assert.strictEqual(result, "{{{datatype}}}");
		});

		it("should remove delimiter change markers", () => {
			const result = convertTemplate("{{=<% %>=}}<%var%><%={{ }}=%>");
			assert.strictEqual(result, "{{{var}}}");
		});

		it("should convert array.0 pattern to if", () => {
			const result = convertTemplate("{{#imports.0}}has imports{{/imports.0}}");
			assert.strictEqual(result, "{{#if imports}}has imports{{/if}}");
		});

		it("should convert inverted array.0 pattern to unless", () => {
			const result = convertTemplate("{{^imports.0}}no imports{{/imports.0}}");
			assert.strictEqual(result, "{{#unless imports}}no imports{{/unless}}");
		});

		it("should convert lambda.X to helper syntax", () => {
			const result = convertTemplate(
				"{{#lambda.camelcase}}some text{{/lambda.camelcase}}",
			);
			assert.strictEqual(result, "{{#camelcase}}some text{{/camelcase}}");
		});

		it("should convert inline lambda to helper", () => {
			const result = convertTemplate("{{lambda.lowercase}}");
			assert.strictEqual(result, "{{lowercase}}");
		});

		it("should convert returnType conditional to if", () => {
			const result = convertTemplate(
				"{{#returnType}}has return{{/returnType}}",
			);
			assert.strictEqual(result, "{{#if returnType}}has return{{/if}}");
		});

		it("should convert inverted returnType to unless", () => {
			const result = convertTemplate("{{^returnType}}void{{/returnType}}");
			assert.strictEqual(result, "{{#unless returnType}}void{{/unless}}");
		});

		it("should preserve block variables like operations", () => {
			const result = convertTemplate(
				"{{#operations}}{{classname}}{{/operations}}",
			);
			assert.strictEqual(result, "{{#operations}}{{classname}}{{/operations}}");
		});

		it("should preserve boolean conditionals", () => {
			const result = convertTemplate("{{#isArray}}array{{/isArray}}");
			assert.strictEqual(result, "{{#isArray}}array{{/isArray}}");
		});

		it("should handle complex nested template", () => {
			const input = `{{#operations}}
{{#operation}}
{{#returnType}}
return {{returnType}}
{{/returnType}}
{{^returnType}}
void
{{/returnType}}
{{/operation}}
{{/operations}}`;

			const result = convertTemplate(input);

			// Should use {{#if returnType}} not {{#returnType}}
			assert.ok(result.includes("{{#if returnType}}"));
			assert.ok(result.includes("{{/if}}"));
			assert.ok(result.includes("{{#unless returnType}}"));
			// Should preserve operations and operation blocks
			assert.ok(result.includes("{{#operations}}"));
			assert.ok(result.includes("{{#operation}}"));
		});

		it("should handle dataType conditional", () => {
			const result = convertTemplate(
				"{{#dataType}}type: {{dataType}}{{/dataType}}",
			);
			assert.strictEqual(result, "{{#if dataType}}type: {{dataType}}{{/if}}");
		});
	});
});
