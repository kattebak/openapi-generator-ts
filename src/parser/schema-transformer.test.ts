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

	it("should resolve a direct $ref enum property to the referenced type", () => {
		const schema: OpenAPIV3.SchemaObject = {
			type: "object",
			required: ["status"],
			properties: {
				status: {
					$ref: "#/components/schemas/WorkspaceStatus",
				} as OpenAPIV3.SchemaObject,
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
		assert.strictEqual(statusProp.isPrimitiveType, false);
		assert.strictEqual(statusProp.isAnyType, false);
		assert.strictEqual(statusProp.required, true);
		assert.ok(model.imports.has("WorkspaceStatus"));
	});

	it("should resolve a direct $ref object property to the referenced type", () => {
		const schema: OpenAPIV3.SchemaObject = {
			type: "object",
			properties: {
				primary: {
					$ref: "#/components/schemas/Workspace",
				} as OpenAPIV3.SchemaObject,
			},
		};

		const transformer = new SchemaTransformer();
		const model = transformer.transformSchema("WorkspaceListResponse", schema);
		const primaryProp = model.vars.find((prop) => prop.baseName === "primary");

		assert.ok(primaryProp);
		assert.strictEqual(primaryProp.dataType, "Workspace");
		assert.strictEqual(primaryProp.complexType, "Workspace");
		assert.strictEqual(primaryProp.isModel, true);
		assert.strictEqual(primaryProp.isAnyType, false);
		assert.strictEqual(primaryProp.required, false);
		assert.ok(model.imports.has("Workspace"));
	});

	it("should import the element type of an array-of-$ref property", () => {
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

		assert.ok(model.imports.has("Workspace"));
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

/**
 * A five-variant union discriminated by a literal field, mixing Date and
 * non-Date payloads. Serializing it correctly requires dispatching on the
 * discriminator rather than treating every variant alike.
 */
const unionSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	AttributeValueValue: {
		oneOf: [
			{ $ref: "#/components/schemas/CodeSetValue" },
			{ $ref: "#/components/schemas/NumberValue" },
			{ $ref: "#/components/schemas/NumberRangeValue" },
			{ $ref: "#/components/schemas/DateValue" },
			{ $ref: "#/components/schemas/DateRangeValue" },
		],
		discriminator: {
			propertyName: "valueKind",
			mapping: {
				Code: "#/components/schemas/CodeSetValue",
				Number: "#/components/schemas/NumberValue",
				NumberRange: "#/components/schemas/NumberRangeValue",
				Date: "#/components/schemas/DateValue",
				DateRange: "#/components/schemas/DateRangeValue",
			},
		},
	},
	CodeSetValue: {
		type: "object",
		required: ["valueKind", "value"],
		properties: {
			valueKind: { type: "string", enum: ["Code"] },
			value: { type: "string" },
		},
	},
	NumberValue: {
		type: "object",
		required: ["valueKind", "value"],
		properties: {
			valueKind: { type: "string", enum: ["Number"] },
			value: { type: "number" },
		},
	},
	NumberRangeValue: {
		type: "object",
		required: ["valueKind", "start", "end"],
		properties: {
			valueKind: { type: "string", enum: ["NumberRange"] },
			start: { type: "number" },
			end: { type: "number" },
		},
	},
	DateValue: {
		type: "object",
		required: ["valueKind", "value"],
		properties: {
			valueKind: { type: "string", enum: ["Date"] },
			value: { type: "string", format: "date-time" },
		},
	},
	DateRangeValue: {
		type: "object",
		required: ["valueKind", "start", "end"],
		properties: {
			valueKind: { type: "string", enum: ["DateRange"] },
			start: { type: "string", format: "date-time" },
			end: { type: "string", format: "date-time" },
		},
	},
};

describe("SchemaTransformer oneOf unions", () => {
	it("should resolve the discriminator mapping into mapped models", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas(unionSchemas);
		const union = models.get("AttributeValueValue");

		assert.ok(union);
		assert.ok(union.discriminator);
		assert.strictEqual(union.discriminator.propertyName, "valueKind");
		assert.strictEqual(union.discriminator.propertyBaseName, "valueKind");
		assert.strictEqual(union.hasDiscriminatorWithNonEmptyMapping, true);

		assert.deepStrictEqual(
			union.discriminator.mappedModels?.map((mapped) => [
				mapped.mappingName,
				mapped.modelName,
			]),
			[
				["Code", "CodeSetValue"],
				["Number", "NumberValue"],
				["NumberRange", "NumberRangeValue"],
				["Date", "DateValue"],
				["DateRange", "DateRangeValue"],
			],
		);
	});

	it("should repeat the discriminator on itself and on every mapped model", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas(unionSchemas);
		const discriminator = models.get("AttributeValueValue")?.discriminator;

		assert.ok(discriminator);
		// Templates read these paths from contexts that Handlebars will not
		// resolve them from otherwise.
		assert.strictEqual(discriminator.discriminator, discriminator);

		for (const mapped of discriminator.mappedModels ?? []) {
			assert.strictEqual(mapped.discriminator?.propertyName, "valueKind");
			assert.strictEqual(mapped.discriminator?.propertyBaseName, "valueKind");
		}
	});

	it("should derive mapped models from the members when no mapping is given", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas({
			...unionSchemas,
			AttributeValueValue: {
				oneOf: [
					{ $ref: "#/components/schemas/CodeSetValue" },
					{ $ref: "#/components/schemas/DateValue" },
				],
				discriminator: { propertyName: "valueKind" },
			},
		});
		const union = models.get("AttributeValueValue");

		assert.ok(union);
		assert.strictEqual(union.hasDiscriminatorWithNonEmptyMapping, false);
		assert.deepStrictEqual(
			union.discriminator?.mappedModels?.map((mapped) => [
				mapped.mappingName,
				mapped.modelName,
			]),
			[
				["CodeSetValue", "CodeSetValue"],
				["DateValue", "DateValue"],
			],
		);
	});

	it("should classify object members as oneOf models the union imports", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas(unionSchemas);
		const union = models.get("AttributeValueValue");

		assert.ok(union);
		assert.deepStrictEqual(union.oneOfModels, [
			"CodeSetValue",
			"NumberValue",
			"NumberRangeValue",
			"DateValue",
			"DateRangeValue",
		]);
		assert.deepStrictEqual(union.oneOfArrays, []);
		assert.deepStrictEqual(union.oneOfPrimitives, []);
		assert.strictEqual(union.hasImports, true);
	});

	it("should classify enum and primitive members as oneOf primitives", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas({
			Kind: { type: "string", enum: ["Code", "Date"] },
			Count: { type: "integer" },
			Mixed: {
				oneOf: [
					{ $ref: "#/components/schemas/Kind" },
					{ $ref: "#/components/schemas/Count" },
					{ $ref: "#/components/schemas/CodeSetValue" },
				],
			},
			CodeSetValue: unionSchemas.CodeSetValue,
		});
		const union = models.get("Mixed");

		assert.ok(union);
		assert.deepStrictEqual(union.oneOfModels, ["CodeSetValue"]);
		assert.deepStrictEqual(
			union.oneOfPrimitives?.map((member) => member.dataType),
			["Kind", "Count"],
		);

		const [kind] = union.oneOfPrimitives ?? [];
		assert.strictEqual(kind.isEnum, true);
		assert.deepStrictEqual(kind.allowableValues?.values, ["Code", "Date"]);
	});

	it("should keep an inline discriminator enum on the variant that declares it", () => {
		const transformer = new SchemaTransformer();
		const models = transformer.transformSchemas(unionSchemas);
		const dateValue = models.get("DateValue");

		const valueKind = dateValue?.vars.find(
			(prop) => prop.baseName === "valueKind",
		);
		assert.strictEqual(valueKind?.isEnum, true);
		assert.deepStrictEqual(valueKind?.allowableValues?.values, ["Date"]);
		assert.strictEqual(dateValue?.hasEnums, true);
	});
});
