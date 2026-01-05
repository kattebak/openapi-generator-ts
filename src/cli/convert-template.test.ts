import assert from "node:assert";
import { describe, it } from "node:test";
import { convertTemplate } from "./convert-template.js";

describe("Template Converter", () => {
	describe("convertTemplate", () => {
		it("should pass through simple variables", () => {
			const result = convertTemplate("{{name}}");
			assert.strictEqual(result, "{{name}}");
		});

		it("should pass through triple mustache", () => {
			const result = convertTemplate("{{{html}}}");
			assert.strictEqual(result, "{{{html}}}");
		});

		it("should pass through sections", () => {
			const result = convertTemplate("{{#items}}{{name}}{{/items}}");
			assert.strictEqual(result, "{{#items}}{{name}}{{/items}}");
		});

		it("should convert delimiter-change JSDoc pattern", () => {
			const input = "* @type {{=<% %>=}}{<%&datatype%>}<%={{ }}=%>";
			const result = convertTemplate(input);
			assert.strictEqual(result, "* @type {{braceWrap datatype}}");
		});

		it("should convert lambda block helpers", () => {
			const input = "{{#lambda.camelcase}}someName{{/lambda.camelcase}}";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{#camelcase}}someName{{/camelcase}}");
		});

		it("should convert lambda inline helpers", () => {
			const input = "{{lambda.lowercase name}}";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{lowercase name}}");
		});

		it("should convert array index access", () => {
			const input = "{{items.0.name}}";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{items.[0].name}}");
		});

		it("should handle -first and -last in iterations", () => {
			const input = "{{#-first}}First{{/-first}}{{#-last}}Last{{/-last}}";
			const result = convertTemplate(input);
			assert.strictEqual(
				result,
				"{{#if @first}}First{{/if}}{{#if @last}}Last{{/if}}",
			);
		});

		it("should handle inverted -first", () => {
			const input = "{{^-first}}, {{/-first}}";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{#unless @first}}, {{/unless}}");
		});

		it("should remove standalone delimiter changes", () => {
			const input = "before{{=<% %>=}}after";
			const result = convertTemplate(input);
			assert.strictEqual(result, "beforeafter");
		});

		it("should convert remaining alternate delimiter variables", () => {
			const input = "{{=<% %>=}}<%name%><%={{ }}=%>";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{name}}");
		});

		it("should convert remaining alternate delimiter unescaped", () => {
			const input = "{{=<% %>=}}<%&html%><%={{ }}=%>";
			const result = convertTemplate(input);
			assert.strictEqual(result, "{{{html}}}");
		});

		it("should handle complex real-world template", () => {
			const input = `/**
 * @param {{=<% %>=}}{<%&dataType%>}<%={{ }}=%> {{paramName}} {{description}}
 */`;
			const result = convertTemplate(input);
			assert.strictEqual(
				result,
				`/**
 * @param {{braceWrap dataType}} {{paramName}} {{description}}
 */`,
			);
		});
	});
});
