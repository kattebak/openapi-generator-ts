/**
 * Operation transformer
 * Converts OpenAPI operations to CodegenOperation objects
 */

import { camelCase, pascalCase, snakeCase } from "es-toolkit/string";
import type { OpenAPIV3 } from "openapi-types";
import {
	type CodegenOperation,
	type CodegenParameter,
	type CodegenProperty,
	type CodegenResponse,
	type CodegenSecurity,
	type ContentType,
	createCodegenOperation,
	createCodegenParameter,
	createCodegenResponse,
	createCodegenSecurity,
} from "../models/index.js";
import { SchemaTransformer } from "./schema-transformer.js";

export interface OperationTransformerOptions {
	/**
	 * Type mappings from OpenAPI types to target language types
	 */
	typeMappings?: Record<string, string>;
}

const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"delete",
	"patch",
	"options",
	"head",
	"trace",
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

export class OperationTransformer {
	private schemaTransformer: SchemaTransformer;

	constructor(options: OperationTransformerOptions = {}) {
		this.schemaTransformer = new SchemaTransformer({
			typeMappings: options.typeMappings,
		});
	}

	/**
	 * Transform all operations in paths object
	 */
	transformPaths(
		paths: OpenAPIV3.PathsObject,
		securitySchemes?: Record<string, OpenAPIV3.SecuritySchemeObject>,
	): Map<string, CodegenOperation[]> {
		const operationsByTag = new Map<string, CodegenOperation[]>();

		for (const [path, pathItem] of Object.entries(paths)) {
			if (!pathItem) continue;

			// Get path-level parameters
			const pathParameters = (pathItem.parameters ??
				[]) as OpenAPIV3.ParameterObject[];

			for (const method of HTTP_METHODS) {
				const operation = pathItem[method] as
					| OpenAPIV3.OperationObject
					| undefined;
				if (!operation) continue;

				const codegenOp = this.transformOperation(
					path,
					method,
					operation,
					pathParameters,
					securitySchemes,
				);

				// Group by tag
				const tags = codegenOp.tags.length > 0 ? codegenOp.tags : ["default"];
				for (const tag of tags) {
					const ops = operationsByTag.get(tag) ?? [];
					ops.push(codegenOp);
					operationsByTag.set(tag, ops);
				}
			}
		}

		return operationsByTag;
	}

	/**
	 * Transform a single operation
	 */
	transformOperation(
		path: string,
		method: HttpMethod,
		operation: OpenAPIV3.OperationObject,
		pathParameters: OpenAPIV3.ParameterObject[],
		securitySchemes?: Record<string, OpenAPIV3.SecuritySchemeObject>,
	): CodegenOperation {
		const operationId =
			operation.operationId ?? this.generateOperationId(path, method);
		const codegenOp = createCodegenOperation(
			operationId,
			path,
			method.toUpperCase(),
		);

		// Basic info
		codegenOp.operationIdOriginal = operationId;
		codegenOp.operationIdCamelCase = camelCase(operationId);
		codegenOp.operationIdSnakeCase = snakeCase(operationId);
		codegenOp.summary = operation.summary;
		codegenOp.notes = operation.description;
		codegenOp.unescapedNotes = operation.description;
		codegenOp.isDeprecated = operation.deprecated ?? false;

		// Tags
		codegenOp.tags = operation.tags ?? [];
		codegenOp.baseName = codegenOp.tags[0] ?? "default";

		// Vendor extensions
		codegenOp.vendorExtensions = this.extractVendorExtensions(
			operation as Record<string, unknown>,
		);

		// External docs
		if (operation.externalDocs) {
			codegenOp.externalDocs = {
				url: operation.externalDocs.url,
				description: operation.externalDocs.description,
			};
		}

		// Parameters (merge path-level and operation-level)
		const allParameters = [
			...pathParameters,
			...((operation.parameters as OpenAPIV3.ParameterObject[]) ?? []),
		];

		for (const param of allParameters) {
			if (this.isReferenceObject(param)) continue;
			const codegenParam = this.transformParameter(param);
			this.addParameter(codegenOp, codegenParam);
		}

		// Request body
		if (
			operation.requestBody &&
			!this.isReferenceObject(operation.requestBody)
		) {
			this.transformRequestBody(codegenOp, operation.requestBody);
		}

		// Responses
		if (operation.responses) {
			for (const [code, response] of Object.entries(operation.responses)) {
				if (this.isReferenceObject(response)) continue;
				const codegenResponse = this.transformResponse(code, response);
				codegenOp.responses.push(codegenResponse);

				if (codegenResponse.is2xx) {
					codegenOp.successResponses.push(codegenResponse);
					// Set return type from first success response
					if (!codegenOp.returnType && codegenResponse.dataType) {
						codegenOp.returnType = codegenResponse.dataType;
						codegenOp.returnBaseType = codegenResponse.baseType;
						codegenOp.returnContainer = codegenResponse.containerType;
					}
				} else if (codegenResponse.is4xx || codegenResponse.is5xx) {
					codegenOp.errorResponses.push(codegenResponse);
				}

				if (codegenResponse.isDefault) {
					codegenOp.defaultResponse = codegenResponse;
				}
			}
		}

		// Security
		const security = operation.security;
		if (security && securitySchemes) {
			for (const secReq of security) {
				for (const [name, scopes] of Object.entries(secReq)) {
					const scheme = securitySchemes[name];
					if (scheme) {
						const authMethod = this.transformSecurityScheme(
							name,
							scheme,
							scopes,
						);
						codegenOp.authMethods.push(authMethod);
					}
				}
			}
			codegenOp.hasAuthMethods = codegenOp.authMethods.length > 0;
		}

		// Servers
		if (operation.servers) {
			codegenOp.servers = operation.servers.map((server) => ({
				url: server.url,
				description: server.description,
				variables: server.variables
					? Object.fromEntries(
							Object.entries(server.variables).map(([key, val]) => [
								key,
								{
									defaultValue: val.default,
									description: val.description,
									enumValues: val.enum,
								},
							]),
						)
					: undefined,
			}));
			codegenOp.hasServers = codegenOp.servers.length > 0;
		}

		// Update flags
		codegenOp.hasPathParams = codegenOp.pathParams.length > 0;
		codegenOp.hasQueryParams = codegenOp.queryParams.length > 0;
		codegenOp.hasHeaderParams = codegenOp.headerParams.length > 0;
		codegenOp.hasCookieParams = codegenOp.cookieParams.length > 0;
		codegenOp.hasFormParams = codegenOp.formParams.length > 0;
		codegenOp.hasBodyParam = !!codegenOp.bodyParam;
		codegenOp.hasRequiredParams = codegenOp.requiredParams.length > 0;
		codegenOp.hasOptionalParams = codegenOp.optionalParams.length > 0;

		return codegenOp;
	}

	/**
	 * Transform a parameter
	 */
	private transformParameter(
		param: OpenAPIV3.ParameterObject,
	): CodegenParameter {
		const codegenParam = createCodegenParameter(param.name, "string");

		codegenParam.paramName = camelCase(param.name);
		codegenParam.baseName = param.name;
		codegenParam.description = param.description;
		codegenParam.required = param.required ?? false;
		codegenParam.deprecated = param.deprecated ?? false;
		codegenParam.allowEmptyValue = param.allowEmptyValue;
		codegenParam.style = param.style;
		codegenParam.explode = param.explode;

		// Parameter location
		codegenParam.isPathParam = param.in === "path";
		codegenParam.isQueryParam = param.in === "query";
		codegenParam.isHeaderParam = param.in === "header";
		codegenParam.isCookieParam = param.in === "cookie";

		// Path params are always required
		if (codegenParam.isPathParam) {
			codegenParam.required = true;
		}

		// Schema info
		if (param.schema && !this.isReferenceObject(param.schema)) {
			const property = this.schemaTransformer.transformPropertySchema(
				param.name,
				param.schema,
				codegenParam.required,
			);

			codegenParam.dataType = property.dataType;
			codegenParam.isString = property.isString;
			codegenParam.isNumeric = property.isNumeric;
			codegenParam.isInteger = property.isInteger;
			codegenParam.isLong = property.isLong;
			codegenParam.isNumber = property.isNumber;
			codegenParam.isFloat = property.isFloat;
			codegenParam.isDouble = property.isDouble;
			codegenParam.isBoolean = property.isBoolean;
			codegenParam.isDate = property.isDate;
			codegenParam.isDateTime = property.isDateTime;
			codegenParam.isArray = property.isArray;
			codegenParam.isMap = property.isMap;
			codegenParam.isEnum = property.isEnum;
			codegenParam.isPrimitiveType = property.isPrimitiveType;
			codegenParam.isNullable = property.isNullable;

			codegenParam.defaultValue = property.defaultValue;
			codegenParam.example = property.example;
			codegenParam.allowableValues = property.allowableValues;

			// Constraints
			codegenParam.maxLength = property.maxLength;
			codegenParam.minLength = property.minLength;
			codegenParam.minimum = property.minimum;
			codegenParam.maximum = property.maximum;
			codegenParam.pattern = property.pattern;
			codegenParam.maxItems = property.maxItems;
			codegenParam.minItems = property.minItems;
			codegenParam.hasValidation = property.hasValidation;

			if (property.items) {
				codegenParam.items = property.items;
			}
		}

		// Name variants
		codegenParam.nameInCamelCase = camelCase(param.name);
		codegenParam.nameInPascalCase = pascalCase(param.name);
		codegenParam.nameInSnakeCase = snakeCase(param.name);

		// Vendor extensions
		codegenParam.vendorExtensions = this.extractVendorExtensions(
			param as unknown as Record<string, unknown>,
		);

		return codegenParam;
	}

	/**
	 * Transform request body
	 */
	private transformRequestBody(
		operation: CodegenOperation,
		requestBody: OpenAPIV3.RequestBodyObject,
	): void {
		const content = requestBody.content;
		if (!content) return;

		// Determine content types
		const contentTypes = Object.keys(content);
		operation.consumes = contentTypes.map((ct) => this.parseContentType(ct));
		operation.hasConsumes = operation.consumes.length > 0;

		// Check for multipart
		operation.isMultipart = contentTypes.some(
			(ct) => ct.includes("multipart") || ct.includes("form-data"),
		);

		// Process each content type
		for (const [mediaType, mediaTypeObj] of Object.entries(content)) {
			if (!mediaTypeObj.schema) continue;

			if (this.isReferenceObject(mediaTypeObj.schema)) continue;

			const isForm =
				mediaType.includes("form") ||
				mediaType.includes("urlencoded") ||
				mediaType.includes("multipart");

			if (isForm && mediaTypeObj.schema.properties) {
				// Form parameters
				for (const [propName, propSchema] of Object.entries(
					mediaTypeObj.schema.properties,
				)) {
					if (this.isReferenceObject(propSchema)) continue;

					const property = this.schemaTransformer.transformPropertySchema(
						propName,
						propSchema,
						(mediaTypeObj.schema.required ?? []).includes(propName),
					);

					const formParam = this.propertyToParameter(property);
					formParam.isFormParam = true;
					formParam.contentType = mediaType;

					operation.formParams.push(formParam);
					this.addParameter(operation, formParam);
				}
			} else {
				// Body parameter
				const property = this.schemaTransformer.transformPropertySchema(
					"body",
					mediaTypeObj.schema,
					requestBody.required ?? false,
				);

				const bodyParam = this.propertyToParameter(property);
				bodyParam.isBodyParam = true;
				bodyParam.paramName = "body";
				bodyParam.baseName = "body";
				bodyParam.description = requestBody.description;
				bodyParam.contentType = mediaType;

				operation.bodyParam = bodyParam;
				operation.bodyParams.push(bodyParam);
				this.addParameter(operation, bodyParam);
			}
		}
	}

	/**
	 * Transform a response
	 */
	private transformResponse(
		code: string,
		response: OpenAPIV3.ResponseObject,
	): CodegenResponse {
		const codegenResponse = createCodegenResponse(
			code,
			response.description ?? "",
		);

		codegenResponse.description = response.description;

		// Response content
		if (response.content) {
			for (const [_mediaType, mediaTypeObj] of Object.entries(
				response.content,
			)) {
				if (!mediaTypeObj.schema) continue;

				if (this.isReferenceObject(mediaTypeObj.schema)) continue;

				const property = this.schemaTransformer.transformPropertySchema(
					"response",
					mediaTypeObj.schema,
					true,
				);

				codegenResponse.dataType = property.dataType;
				codegenResponse.baseType = property.dataType;
				codegenResponse.schema = property;

				// Set type flags
				codegenResponse.isString = property.isString;
				codegenResponse.isNumeric = property.isNumeric;
				codegenResponse.isInteger = property.isInteger;
				codegenResponse.isBoolean = property.isBoolean;
				codegenResponse.isArray = property.isArray;
				codegenResponse.isMap = property.isMap;
				codegenResponse.isPrimitiveType = property.isPrimitiveType;
				codegenResponse.isModel = property.isModel;

				if (property.isArray) {
					codegenResponse.containerType = "array";
				} else if (property.isMap) {
					codegenResponse.containerType = "map";
				}

				break; // Use first content type
			}
		}

		// Response headers
		if (response.headers) {
			for (const [headerName, headerObj] of Object.entries(response.headers)) {
				if (this.isReferenceObject(headerObj)) continue;

				if (headerObj.schema && !this.isReferenceObject(headerObj.schema)) {
					const headerProp = this.schemaTransformer.transformPropertySchema(
						headerName,
						headerObj.schema,
						headerObj.required ?? false,
					);
					headerProp.description = headerObj.description;
					codegenResponse.headers.push(headerProp);
				}
			}
		}

		// Vendor extensions
		codegenResponse.vendorExtensions = this.extractVendorExtensions(
			response as unknown as Record<string, unknown>,
		);

		return codegenResponse;
	}

	/**
	 * Transform a security scheme
	 */
	private transformSecurityScheme(
		name: string,
		scheme: OpenAPIV3.SecuritySchemeObject,
		scopes: string[],
	): CodegenSecurity {
		const security = createCodegenSecurity(name, scheme.type);

		security.description = scheme.description;

		switch (scheme.type) {
			case "http":
				security.isBasic = true;
				security.scheme = scheme.scheme;
				if (scheme.scheme === "basic") {
					security.isBasicBasic = true;
				} else if (scheme.scheme === "bearer") {
					security.isBasicBearer = true;
					security.bearerFormat = scheme.bearerFormat;
				}
				break;

			case "apiKey":
				security.isApiKey = true;
				security.keyParamName = scheme.name;
				security.isKeyInQuery = scheme.in === "query";
				security.isKeyInHeader = scheme.in === "header";
				security.isKeyInCookie = scheme.in === "cookie";
				break;

			case "oauth2":
				security.isOAuth = true;
				if (scheme.flows) {
					const flow =
						scheme.flows.authorizationCode ??
						scheme.flows.implicit ??
						scheme.flows.password ??
						scheme.flows.clientCredentials;
					if (flow) {
						security.authorizationUrl = (
							flow as { authorizationUrl?: string }
						).authorizationUrl;
						security.tokenUrl = (flow as { tokenUrl?: string }).tokenUrl;
						security.refreshUrl = flow.refreshUrl;
						security.scopes = scopes.map((scope) => ({
							scope,
							description: flow.scopes?.[scope],
						}));
					}
				}
				break;

			case "openIdConnect":
				security.isOpenIdConnect = true;
				security.openIdConnectUrl = scheme.openIdConnectUrl;
				break;
		}

		// Vendor extensions
		security.vendorExtensions = this.extractVendorExtensions(
			scheme as unknown as Record<string, unknown>,
		);

		return security;
	}

	/**
	 * Add parameter to operation and categorize it
	 */
	private addParameter(
		operation: CodegenOperation,
		param: CodegenParameter,
	): void {
		operation.allParams.push(param);

		if (param.isPathParam) {
			operation.pathParams.push(param);
		} else if (param.isQueryParam) {
			operation.queryParams.push(param);
		} else if (param.isHeaderParam) {
			operation.headerParams.push(param);
		} else if (param.isCookieParam) {
			operation.cookieParams.push(param);
		}

		if (param.required) {
			operation.requiredParams.push(param);
		} else {
			operation.optionalParams.push(param);
		}

		// Add import if needed
		if (param.complexType) {
			operation.imports.add(param.complexType);
		}
	}

	/**
	 * Convert a CodegenProperty to CodegenParameter
	 */
	private propertyToParameter(property: CodegenProperty): CodegenParameter {
		const param = createCodegenParameter(property.baseName, property.dataType);

		Object.assign(param, {
			description: property.description,
			required: property.required,
			isString: property.isString,
			isNumeric: property.isNumeric,
			isInteger: property.isInteger,
			isLong: property.isLong,
			isNumber: property.isNumber,
			isFloat: property.isFloat,
			isDouble: property.isDouble,
			isBoolean: property.isBoolean,
			isDate: property.isDate,
			isDateTime: property.isDateTime,
			isArray: property.isArray,
			isMap: property.isMap,
			isEnum: property.isEnum,
			isPrimitiveType: property.isPrimitiveType,
			isNullable: property.isNullable,
			defaultValue: property.defaultValue,
			example: property.example,
			allowableValues: property.allowableValues,
			maxLength: property.maxLength,
			minLength: property.minLength,
			minimum: property.minimum,
			maximum: property.maximum,
			pattern: property.pattern,
			hasValidation: property.hasValidation,
			items: property.items,
			nameInCamelCase: property.nameInCamelCase,
			nameInPascalCase: property.nameInPascalCase,
			nameInSnakeCase: property.nameInSnakeCase,
		});

		return param;
	}

	/**
	 * Parse content type string into ContentType object
	 */
	private parseContentType(mediaType: string): ContentType {
		const lower = mediaType.toLowerCase();
		return {
			mediaType,
			isJson: lower.includes("json"),
			isXml: lower.includes("xml"),
			isForm: lower.includes("form") || lower.includes("urlencoded"),
			isMultipart: lower.includes("multipart"),
			isBinary:
				lower.includes("octet") ||
				lower.includes("binary") ||
				lower.includes("image") ||
				lower.includes("audio") ||
				lower.includes("video"),
			isText: lower.includes("text"),
		};
	}

	/**
	 * Generate operation ID from path and method
	 */
	private generateOperationId(path: string, method: string): string {
		const pathParts = path
			.split("/")
			.filter((p) => p && !p.startsWith("{"))
			.map((p) => p.replace(/[^a-zA-Z0-9]/g, ""));

		return camelCase([method, ...pathParts].join("_"));
	}

	/**
	 * Type guard for reference objects
	 */
	private isReferenceObject(obj: unknown): obj is OpenAPIV3.ReferenceObject {
		return !!obj && typeof obj === "object" && "$ref" in obj;
	}

	/**
	 * Extract vendor extensions (x-*) from object
	 */
	private extractVendorExtensions(
		obj: Record<string, unknown>,
	): Record<string, unknown> {
		const extensions: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(obj)) {
			if (key.startsWith("x-")) {
				extensions[key] = value;
			}
		}

		return extensions;
	}
}

/**
 * Create an operation transformer with default options
 */
export function createOperationTransformer(
	options?: OperationTransformerOptions,
): OperationTransformer {
	return new OperationTransformer(options);
}
