/**
 * Schema transformer
 * Converts OpenAPI schemas to CodegenModel and CodegenProperty objects
 */

import { camelCase, pascalCase, snakeCase } from "es-toolkit/string";
import type { OpenAPIV3 } from "openapi-types";
import {
	type AllowableValues,
	type CodegenModel,
	type CodegenProperty,
	createCodegenModel,
	createCodegenProperty,
} from "../models/index.js";

export interface SchemaTransformerOptions {
	/**
	 * Type mappings from OpenAPI types to target language types
	 */
	typeMappings?: Record<string, string>;

	/**
	 * Import mappings for model types
	 */
	importMappings?: Record<string, string>;

	/**
	 * Naming convention for property names
	 */
	propertyNaming?: "camelCase" | "snake_case" | "original";

	/**
	 * Naming convention for model names
	 */
	modelNaming?: "PascalCase" | "camelCase" | "original";

	/**
	 * Reserved words that require model renaming (adds "Model" prefix)
	 */
	reservedWords?: Set<string>;

	/**
	 * Custom function to convert property names for the target language.
	 * For Go, this returns PascalCase for exported fields.
	 * If not provided, uses camelCase by default.
	 */
	toVarName?: (name: string) => string;

	/**
	 * Post-process a property for generator-specific transformations.
	 * For Go, this adds x-go-base-type and x-go-datatag vendor extensions.
	 */
	postProcessProperty?: (property: CodegenProperty) => void;
}

const DEFAULT_TYPE_MAPPINGS: Record<string, string> = {
	integer: "number",
	long: "number",
	float: "number",
	double: "number",
	number: "number",
	string: "string",
	boolean: "boolean",
	date: "string",
	"date-time": "string",
	binary: "Blob",
	byte: "string",
	uuid: "string",
	uri: "string",
	email: "string",
	password: "string",
	file: "File",
	object: "object",
	array: "Array",
};

export class SchemaTransformer {
	private options: SchemaTransformerOptions;
	private typeMappings: Record<string, string>;
	private modelCache: Map<string, CodegenModel> = new Map();

	constructor(options: SchemaTransformerOptions = {}) {
		this.options = options;
		this.typeMappings = { ...DEFAULT_TYPE_MAPPINGS, ...options.typeMappings };
	}

	/**
	 * Transform all schemas in a components object to CodegenModels
	 */
	transformSchemas(
		schemas: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>,
	): Map<string, CodegenModel> {
		const models = new Map<string, CodegenModel>();

		for (const [name, schema] of Object.entries(schemas)) {
			if (this.isReferenceObject(schema)) {
				continue; // Skip references at this level
			}

			// Skip array aliases (e.g., Pets = Array<Pet>)
			// These are not generated as separate models
			if (this.isArrayAlias(schema)) {
				continue;
			}

			const model = this.transformSchema(name, schema);
			models.set(name, model);
			this.modelCache.set(name, model);
		}

		// Second pass: resolve parent references
		this.resolveInheritance(models);

		return models;
	}

	/**
	 * Check if a schema is an array alias (type: array with $ref items, no properties)
	 */
	private isArrayAlias(schema: OpenAPIV3.SchemaObject): boolean {
		if (schema.type !== "array") {
			return false;
		}
		const arraySchema = schema as OpenAPIV3.ArraySchemaObject;
		// It's an alias if items is a $ref and there are no other properties
		return (
			arraySchema.items !== undefined &&
			this.isReferenceObject(arraySchema.items) &&
			!schema.properties
		);
	}

	/**
	 * Transform a single schema to a CodegenModel
	 */
	transformSchema(name: string, schema: OpenAPIV3.SchemaObject): CodegenModel {
		const classname = this.toModelName(name);
		const model = createCodegenModel(name, classname);

		// Set classFilename for templates (same as classname for TypeScript)
		model.classFilename = classname;

		// Basic info
		model.title = schema.title;
		model.description = schema.description;
		model.unescapedDescription = schema.description;
		model.isDeprecated = schema.deprecated ?? false;
		model.isNullable = schema.nullable ?? false;

		// External docs
		if (schema.externalDocs) {
			model.externalDocs = {
				url: schema.externalDocs.url,
				description: schema.externalDocs.description,
			};
		}

		// Vendor extensions
		model.vendorExtensions = this.extractVendorExtensions(
			schema as unknown as Record<string, unknown>,
		);

		// Handle different schema types
		if (schema.enum) {
			this.transformEnumSchema(model, schema);
		} else if (schema.type === "array") {
			this.transformArraySchema(model, schema);
		} else if (schema.type === "object" || schema.properties) {
			this.transformObjectSchema(model, schema);
		} else if (schema.allOf) {
			this.transformAllOfSchema(model, schema);
		} else if (schema.oneOf) {
			this.transformOneOfSchema(model, schema);
		} else if (schema.anyOf) {
			this.transformAnyOfSchema(model, schema);
		} else if (schema.additionalProperties) {
			this.transformMapSchema(model, schema);
		} else {
			// Primitive type alias
			this.transformPrimitiveSchema(model, schema);
		}

		// Set helper flags
		model.hasVars = model.vars.length > 0;
		model.hasEnums = model.vars.some((v) => v.isEnum);
		model.hasRequired = model.requiredVars.length > 0;
		model.hasOptional = model.optionalVars.length > 0;
		model.hasReadOnly = model.readOnlyVars.length > 0;
		model.hasOnlyReadOnly =
			model.vars.length > 0 && model.vars.every((v) => v.isReadOnly);

		return model;
	}

	/**
	 * Transform an enum schema
	 */
	private transformEnumSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isEnum = true;
		model.isString = schema.type === "string";
		model.isInteger = schema.type === "integer";
		model.isNumber = schema.type === "number";

		const enumValues = schema.enum ?? [];
		model.allowableValues = this.createAllowableValues(enumValues, schema.type);
	}

	/**
	 * Transform an array schema
	 */
	private transformArraySchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isArray = true;
		model.isContainer = true;

		const arraySchema = schema as OpenAPIV3.ArraySchemaObject;
		if (arraySchema.items) {
			if (this.isReferenceObject(arraySchema.items)) {
				// Handle reference to another model
				const refName = this.getRefName(arraySchema.items.$ref);
				model.arrayModelType = refName;
			} else {
				model.items = this.transformPropertySchema(
					"items",
					arraySchema.items,
					false,
				);
				model.arrayModelType = model.items.dataType;
			}
		}

		// Constraints
		model.maxItems = schema.maxItems;
		model.minItems = schema.minItems;
		model.uniqueItems = schema.uniqueItems;
	}

	/**
	 * Transform an object schema with properties
	 */
	private transformObjectSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isModel = true;
		const requiredSet = new Set(schema.required ?? []);

		// Transform properties
		if (schema.properties) {
			for (const [propName, propSchema] of Object.entries(schema.properties)) {
				if (this.isReferenceObject(propSchema)) {
					continue;
				}

				const isRequired = requiredSet.has(propName);
				const property = this.transformPropertySchema(
					propName,
					propSchema,
					isRequired,
				);

				// Add parent model classname to property for template access
				// This is needed because Handlebars doesn't auto-traverse parent scope
				(property as unknown as Record<string, unknown>).classname =
					model.classname;

				model.vars.push(property);
				model.allVars.push(property);

				if (isRequired) {
					model.requiredVars.push(property);
				} else {
					model.optionalVars.push(property);
				}

				if (property.isReadOnly) {
					model.readOnlyVars.push(property);
				} else {
					model.readWriteVars.push(property);
				}

				if (!property.isNullable) {
					model.nonNullableVars.push(property);
				}

				// Add import if needed
				if (property.complexType) {
					model.imports.add(property.complexType);
				}
			}
		}

		// Handle additionalProperties
		if (schema.additionalProperties === true) {
			model.isAdditionalPropertiesTrue = true;
			model.isFreeFormObject = true;
		} else if (
			schema.additionalProperties &&
			!this.isReferenceObject(schema.additionalProperties)
		) {
			model.additionalProperties = this.transformPropertySchema(
				"additionalProperties",
				schema.additionalProperties,
				false,
			);
			model.additionalPropertiesType = model.additionalProperties.dataType;
		}

		// Constraints
		model.maxProperties = schema.maxProperties;
		model.minProperties = schema.minProperties;
	}

	/**
	 * Transform an allOf composition schema
	 */
	private transformAllOfSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isModel = true;

		if (!schema.allOf) return;

		for (const subSchema of schema.allOf) {
			if (this.isReferenceObject(subSchema)) {
				const refName = this.getRefName(subSchema.$ref);
				model.allOf.push(refName);
				model.allParents.push(refName);

				// First parent becomes the main parent
				if (!model.parent) {
					model.parent = refName;
					model.parentSchema = refName;
				} else {
					model.interfaces.push(refName);
				}

				model.imports.add(refName);
			} else {
				// Inline schema - merge properties
				if (subSchema.properties) {
					const tempModel = this.transformSchema("", subSchema);
					model.vars.push(...tempModel.vars);
					model.allVars.push(...tempModel.allVars);
					model.requiredVars.push(...tempModel.requiredVars);
					model.optionalVars.push(...tempModel.optionalVars);
				}
			}
		}

		// Handle discriminator
		if (schema.discriminator) {
			model.discriminator = {
				propertyName: schema.discriminator.propertyName,
				propertyBaseName: schema.discriminator.propertyName,
				mapping: schema.discriminator.mapping,
			};
			model.hasDiscriminatorWithNonEmptyMapping =
				!!schema.discriminator.mapping &&
				Object.keys(schema.discriminator.mapping).length > 0;
		}
	}

	/**
	 * Transform a oneOf composition schema
	 */
	private transformOneOfSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isModel = true;

		if (!schema.oneOf) return;

		for (const subSchema of schema.oneOf) {
			if (this.isReferenceObject(subSchema)) {
				const refName = this.getRefName(subSchema.$ref);
				model.oneOf.push(refName);
				model.imports.add(refName);
			}
		}

		// Handle discriminator
		if (schema.discriminator) {
			model.discriminator = {
				propertyName: schema.discriminator.propertyName,
				propertyBaseName: schema.discriminator.propertyName,
				mapping: schema.discriminator.mapping,
			};
			model.hasDiscriminatorWithNonEmptyMapping =
				!!schema.discriminator.mapping &&
				Object.keys(schema.discriminator.mapping).length > 0;
		}
	}

	/**
	 * Transform an anyOf composition schema
	 */
	private transformAnyOfSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isModel = true;

		if (!schema.anyOf) return;

		for (const subSchema of schema.anyOf) {
			if (this.isReferenceObject(subSchema)) {
				const refName = this.getRefName(subSchema.$ref);
				model.anyOf.push(refName);
				model.imports.add(refName);
			}
		}
	}

	/**
	 * Transform a map schema (additionalProperties only)
	 */
	private transformMapSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isMap = true;
		model.isContainer = true;

		if (schema.additionalProperties === true) {
			model.isAdditionalPropertiesTrue = true;
			model.additionalPropertiesType = "any";
		} else if (
			schema.additionalProperties &&
			!this.isReferenceObject(schema.additionalProperties)
		) {
			model.additionalProperties = this.transformPropertySchema(
				"value",
				schema.additionalProperties,
				false,
			);
			model.additionalPropertiesType = model.additionalProperties.dataType;
		}
	}

	/**
	 * Transform a primitive type alias schema
	 */
	private transformPrimitiveSchema(
		model: CodegenModel,
		schema: OpenAPIV3.SchemaObject,
	): void {
		model.isAlias = true;
		model.isPrimitiveType = true;

		const typeInfo = this.getTypeInfo(schema);
		Object.assign(model, typeInfo);
	}

	/**
	 * Transform a property schema to CodegenProperty
	 */
	transformPropertySchema(
		name: string,
		schema: OpenAPIV3.SchemaObject,
		required: boolean,
	): CodegenProperty {
		const propName = this.toPropertyName(name);
		const typeInfo = this.getTypeInfo(schema);

		const property = createCodegenProperty(name, typeInfo.dataType ?? "any");

		property.name = propName;
		property.baseName = name;
		property.required = required;
		property.description = schema.description;
		property.unescapedDescription = schema.description;
		property.title = schema.title;
		property.example = schema.example as string;
		property.defaultValue = schema.default as string;

		// Type flags
		Object.assign(property, typeInfo);

		// Constraints
		property.maxLength = schema.maxLength;
		property.minLength = schema.minLength;
		property.minimum = schema.minimum?.toString();
		property.maximum = schema.maximum?.toString();
		property.pattern = schema.pattern;
		property.multipleOf = schema.multipleOf;
		property.exclusiveMinimum = schema.exclusiveMinimum as boolean;
		property.exclusiveMaximum = schema.exclusiveMaximum as boolean;
		property.maxItems = schema.maxItems;
		property.minItems = schema.minItems;
		property.uniqueItems = schema.uniqueItems;

		// Status flags
		property.isReadOnly = schema.readOnly ?? false;
		property.isWriteOnly = schema.writeOnly ?? false;
		property.isNullable = schema.nullable ?? false;
		property.deprecated = schema.deprecated ?? false;

		// Validation flag
		property.hasValidation = !!(
			property.maxLength ||
			property.minLength ||
			property.minimum ||
			property.maximum ||
			property.pattern ||
			property.maxItems ||
			property.minItems
		);

		// Handle enums
		if (schema.enum) {
			property.isEnum = true;
			property.allowableValues = this.createAllowableValues(
				schema.enum,
				schema.type,
			);
		}

		// Handle arrays
		if (schema.type === "array") {
			property.isArray = true;
			property.isContainer = true;

			const arraySchema = schema as OpenAPIV3.ArraySchemaObject;
			if (arraySchema.items && !this.isReferenceObject(arraySchema.items)) {
				property.items = this.transformPropertySchema(
					"items",
					arraySchema.items,
					false,
				);
			}
		}

		// Named getter/setter
		property.getter = `get${pascalCase(propName)}`;
		property.setter = `set${pascalCase(propName)}`;

		// Name variants
		property.nameInCamelCase = camelCase(propName);
		property.nameInPascalCase = pascalCase(propName);
		property.nameInSnakeCase = snakeCase(propName);

		// Vendor extensions from schema
		property.vendorExtensions = this.extractVendorExtensions(
			schema as unknown as Record<string, unknown>,
		);

		// Generator-specific post-processing (e.g., Go vendor extensions)
		if (this.options.postProcessProperty) {
			this.options.postProcessProperty(property);
		}

		return property;
	}

	/**
	 * Get type information from a schema
	 */
	private getTypeInfo(
		schema: OpenAPIV3.SchemaObject,
	): Partial<CodegenProperty> {
		const result: Partial<CodegenProperty> = {};

		const type = schema.type as string;
		const format = schema.format;

		// Map to language type
		const mappedType = format
			? (this.typeMappings[format] ?? this.typeMappings[type] ?? type)
			: (this.typeMappings[type] ?? type);

		result.dataType = mappedType;
		result.openApiType = type;

		// Set type flags
		result.isString = type === "string" && !format;
		result.isNumeric = type === "number" || type === "integer";
		result.isInteger = type === "integer";
		result.isLong = type === "integer" && format === "int64";
		result.isNumber = type === "number";
		result.isFloat = type === "number" && format === "float";
		result.isDouble = type === "number" && format === "double";
		result.isBoolean = type === "boolean";
		result.isDate = type === "string" && format === "date";
		result.isDateTime = type === "string" && format === "date-time";
		result.isByteArray = type === "string" && format === "byte";
		result.isBinary = type === "string" && format === "binary";
		result.isFile = type === "file";
		result.isUuid = type === "string" && format === "uuid";
		result.isUri = type === "string" && format === "uri";
		result.isEmail = type === "string" && format === "email";
		result.isArray = type === "array";
		result.isMap = type === "object" && !!schema.additionalProperties;
		result.isAnyType = !type;

		result.isPrimitiveType =
			result.isString ||
			result.isNumeric ||
			result.isBoolean ||
			result.isDate ||
			result.isDateTime;

		return result;
	}

	/**
	 * Create allowable values object for enums
	 */
	private createAllowableValues(
		enumValues: unknown[],
		type?: string,
	): AllowableValues {
		const isString = type === "string";

		return {
			values: enumValues as Array<string | number | boolean>,
			enumVars: enumValues.map((value) => ({
				name: this.toEnumVarName(String(value)),
				value: isString ? `"${value}"` : String(value),
				isString,
			})),
		};
	}

	/**
	 * Resolve inheritance relationships between models
	 */
	private resolveInheritance(models: Map<string, CodegenModel>): void {
		for (const model of models.values()) {
			if (model.parent) {
				const parentModel = models.get(model.parent);
				if (parentModel) {
					model.parentModel = parentModel;
					parentModel.hasChildren = true;
					parentModel.children = parentModel.children ?? [];
					parentModel.children.push(model);

					// Copy parent vars
					model.parentVars = [...parentModel.vars];

					// allVars should include parent vars
					model.allVars = [...parentModel.allVars, ...model.vars];
				}
			}
		}
	}

	/**
	 * Convert a name to model naming convention
	 */
	private toModelName(name: string): string {
		let result: string;
		switch (this.options.modelNaming) {
			case "camelCase":
				result = camelCase(name);
				break;
			case "original":
				result = name;
				break;
			default:
				result = pascalCase(name);
		}

		// Check if name conflicts with reserved words (like Error, Array, etc.)
		if (this.options.reservedWords?.has(result)) {
			result = `Model${result}`;
		}

		return result;
	}

	/**
	 * Convert a name to property naming convention
	 */
	private toPropertyName(name: string): string {
		// Use custom toVarName function if provided (e.g., for Go PascalCase)
		if (this.options.toVarName) {
			return this.options.toVarName(name);
		}

		switch (this.options.propertyNaming) {
			case "snake_case":
				return snakeCase(name);
			case "original":
				return name;
			default:
				return camelCase(name);
		}
	}

	/**
	 * Convert a value to enum variable name
	 */
	private toEnumVarName(value: string): string {
		// Replace special characters with underscores
		let name = value.replace(/[^a-zA-Z0-9_]/g, "_");

		// Ensure it doesn't start with a number
		if (/^[0-9]/.test(name)) {
			name = `_${name}`;
		}

		return name.toUpperCase();
	}

	/**
	 * Extract ref name from $ref string
	 */
	private getRefName(ref: string): string {
		const parts = ref.split("/");
		return parts[parts.length - 1];
	}

	/**
	 * Type guard for reference objects
	 */
	private isReferenceObject(obj: unknown): obj is OpenAPIV3.ReferenceObject {
		return !!obj && typeof obj === "object" && "$ref" in obj;
	}

	/**
	 * Extract vendor extensions (x-*) from schema
	 */
	private extractVendorExtensions(
		schema: Record<string, unknown>,
	): Record<string, unknown> {
		const extensions: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(schema)) {
			if (key.startsWith("x-")) {
				extensions[key] = value;
			}
		}

		return extensions;
	}
}

/**
 * Create a schema transformer with default options
 */
export function createSchemaTransformer(
	options?: SchemaTransformerOptions,
): SchemaTransformer {
	return new SchemaTransformer(options);
}
