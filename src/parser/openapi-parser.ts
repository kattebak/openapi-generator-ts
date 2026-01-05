/**
 * OpenAPI specification parser
 * Uses @apidevtools/swagger-parser to parse and dereference OpenAPI specs
 */
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPIDocument = OpenAPI.Document;
export type OpenAPIV3Document = OpenAPIV3.Document;
export type OpenAPIV31Document = OpenAPIV3_1.Document;

export interface ParseOptions {
	/**
	 * Fully dereference all $refs (default: false)
	 * When false, uses bundle mode which preserves internal $refs
	 */
	dereference?: boolean;

	/**
	 * Validate the spec against the OpenAPI schema
	 */
	validate?: boolean;

	/**
	 * Allow circular references
	 */
	allowCircular?: boolean;
}

export interface ParsedSpec {
	document: OpenAPIDocument;
	isOpenAPI3: boolean;
	isOpenAPI31: boolean;
	isSwagger2: boolean;
	version: string;
}

/**
 * Parse an OpenAPI specification from a file path or URL
 */
export async function parseSpec(
	input: string,
	options: ParseOptions = {},
): Promise<ParsedSpec> {
	const { dereference = false, validate = true } = options;

	let document: OpenAPIDocument;

	if (dereference) {
		// Validate and dereference (validate() also dereferences)
		if (validate) {
			document = await SwaggerParser.validate(input);
		} else {
			document = await SwaggerParser.dereference(input, {
				dereference: {
					circular: options.allowCircular ?? "ignore",
				},
			});
		}
	} else {
		// Bundle mode: resolves external refs but preserves internal $refs
		// Note: We skip validation here as validate() would dereference
		document = await SwaggerParser.bundle(input);
	}

	const version = getSpecVersion(document);
	const isOpenAPI3 = version.startsWith("3.");
	const isOpenAPI31 = version.startsWith("3.1");
	const isSwagger2 = version.startsWith("2.");

	return {
		document,
		isOpenAPI3,
		isOpenAPI31,
		isSwagger2,
		version,
	};
}

/**
 * Parse an OpenAPI specification from a string (JSON or YAML)
 */
export async function parseSpecFromString(
	content: string,
	options: ParseOptions = {},
): Promise<ParsedSpec> {
	const { dereference = false, validate = true } = options;

	// Parse the string content
	let document: OpenAPIDocument;

	// Try to parse as JSON first, then YAML
	try {
		document = JSON.parse(content) as OpenAPIDocument;
	} catch {
		// If JSON parsing fails, it might be YAML
		const yaml = await import("js-yaml");
		document = yaml.load(content) as OpenAPIDocument;
	}

	if (dereference) {
		// Validate and dereference (validate() also dereferences)
		if (validate) {
			document = await SwaggerParser.validate(document as OpenAPI.Document);
		} else {
			document = await SwaggerParser.dereference(document as OpenAPI.Document, {
				dereference: {
					circular: options.allowCircular ?? "ignore",
				},
			});
		}
	} else {
		// Bundle mode: resolves external refs but preserves internal $refs
		// Note: We skip validation here as validate() would dereference
		document = await SwaggerParser.bundle(document as OpenAPI.Document);
	}

	const version = getSpecVersion(document);
	const isOpenAPI3 = version.startsWith("3.");
	const isOpenAPI31 = version.startsWith("3.1");
	const isSwagger2 = version.startsWith("2.");

	return {
		document,
		isOpenAPI3,
		isOpenAPI31,
		isSwagger2,
		version,
	};
}

/**
 * Get the OpenAPI/Swagger version from a document
 */
function getSpecVersion(document: OpenAPIDocument): string {
	if ("openapi" in document && document.openapi) {
		return document.openapi;
	}
	if ("swagger" in document && document.swagger) {
		return document.swagger;
	}
	return "unknown";
}

/**
 * Type guard for OpenAPI 3.x documents
 */
export function isOpenAPI3(
	document: OpenAPIDocument,
): document is OpenAPIV3Document {
	return "openapi" in document && document.openapi?.startsWith("3.");
}

/**
 * Type guard for OpenAPI 3.1 documents
 */
export function isOpenAPI31(
	document: OpenAPIDocument,
): document is OpenAPIV31Document {
	return "openapi" in document && document.openapi?.startsWith("3.1");
}

/**
 * Get all schemas from the document
 */
export function getSchemas(
	document: OpenAPIDocument,
): Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject> {
	if (isOpenAPI3(document)) {
		return document.components?.schemas ?? {};
	}
	// Swagger 2.0
	if ("definitions" in document && document.definitions) {
		return document.definitions as Record<string, OpenAPIV3.SchemaObject>;
	}
	return {};
}

/**
 * Get all paths/operations from the document
 */
export function getPaths(document: OpenAPIDocument): OpenAPIV3.PathsObject {
	if (isOpenAPI3(document)) {
		return document.paths ?? {};
	}
	// Swagger 2.0
	if ("paths" in document && document.paths) {
		return document.paths as OpenAPIV3.PathsObject;
	}
	return {};
}

/**
 * Get security schemes from the document
 */
export function getSecuritySchemes(
	document: OpenAPIDocument,
): Record<string, OpenAPIV3.SecuritySchemeObject> {
	if (isOpenAPI3(document)) {
		return (document.components?.securitySchemes ?? {}) as Record<
			string,
			OpenAPIV3.SecuritySchemeObject
		>;
	}
	// Swagger 2.0
	if ("securityDefinitions" in document && document.securityDefinitions) {
		return document.securityDefinitions as unknown as Record<
			string,
			OpenAPIV3.SecuritySchemeObject
		>;
	}
	return {};
}

/**
 * Get servers from the document
 */
export function getServers(
	document: OpenAPIDocument,
): OpenAPIV3.ServerObject[] {
	if (isOpenAPI3(document)) {
		return document.servers ?? [];
	}
	// Swagger 2.0 - construct from host, basePath, schemes
	if ("host" in document) {
		const host = document.host ?? "localhost";
		const basePath = ("basePath" in document ? document.basePath : "") ?? "";
		const schemes = ("schemes" in document ? document.schemes : ["https"]) ?? [
			"https",
		];

		return schemes.map((scheme) => ({
			url: `${scheme}://${host}${basePath}`,
		}));
	}
	return [];
}

/**
 * Get external documentation from the document
 */
export function getExternalDocs(
	document: OpenAPIDocument,
): OpenAPIV3.ExternalDocumentationObject | undefined {
	if ("externalDocs" in document) {
		return document.externalDocs;
	}
	return undefined;
}

/**
 * Get tags from the document
 */
export function getTags(document: OpenAPIDocument): OpenAPIV3.TagObject[] {
	if ("tags" in document && document.tags) {
		return document.tags;
	}
	return [];
}

/**
 * Get info from the document
 */
export function getInfo(document: OpenAPIDocument): OpenAPIV3.InfoObject {
	return document.info;
}
