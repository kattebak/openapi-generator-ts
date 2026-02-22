/**
 * SchemaTransformer tests
 * Ensures arrays and allOf refs produce correct property types
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import type { OpenAPIV3 } from "openapi-types";
import { SchemaTransformer } from "./schema-transformer.js";

describe("SchemaTransformer", () => {
	it("should resolve array item refs to generic array types", () => {
		const schema: OpenAPIV3.SchemaObject = {
			type: "object",
			properties: {
				items: {
					type: "array",
					items: { $ref: "#/components/schemas/Workspace" },
				},
			},
		};

		const transformer = new SchemaTransformer();
		const model = transformer.transformSchema("WorkspaceListResponse", schema);
		const itemsProp = model.vars.find((prop) => prop.baseName === "items");

		assert.ok(itemsProp);
		assert.strictEqual(itemsProp.dataType, "Array<Workspace>");
		assert.strictEqual(itemsProp.datatype, "Array<Workspace>");
		assert.ok(itemsProp.items);
		assert.strictEqual(itemsProp.items.datatype, "Workspace");
	});

	it("should unwrap single-ref allOf properties", () => {
		const schema: OpenAPIV3.SchemaObject = {
			type: "object",
			properties: {
				status: {
					allOf: [{ $ref: "#/components/schemas/WorkspaceStatus" }],
					readOnly: true,
				},
			},
		};

		const transformer = new SchemaTransformer();
		const model = transformer.transformSchema("Workspace", schema);
		const statusProp = model.vars.find((prop) => prop.baseName === "status");

		assert.ok(statusProp);
		assert.strictEqual(statusProp.dataType, "WorkspaceStatus");
		assert.strictEqual(statusProp.datatype, "WorkspaceStatus");
		assert.strictEqual(statusProp.complexType, "WorkspaceStatus");
		assert.strictEqual(statusProp.isModel, true);
		assert.strictEqual(statusProp.isAnyType, false);
	});
});
