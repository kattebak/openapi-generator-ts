/**
 * OpenAPI Parser tests
 * Tests for parsing and validating OpenAPI specifications
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	getPaths,
	getSchemas,
	getSecuritySchemes,
	getServers,
	isOpenAPI3,
	isOpenAPI31,
	parseSpecFromString,
} from "./openapi-parser.js";

// Sample petstore-like spec for testing
const petstoreSpec = {
	openapi: "3.0.0",
	info: {
		title: "Petstore API",
		version: "1.0.0",
	},
	paths: {
		"/pets": {
			get: {
				operationId: "listPets",
				responses: {
					"200": {
						description: "List of pets",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Pet" },
								},
							},
						},
					},
				},
			},
		},
	},
	components: {
		schemas: {
			Pet: {
				type: "object",
				required: ["id", "name"],
				properties: {
					id: { type: "integer", format: "int64" },
					name: { type: "string" },
					tag: { type: "string" },
				},
			},
		},
	},
};

describe("OpenAPI Parser", () => {
	describe("parseSpecFromString", () => {
		it("should parse inline spec object", async () => {
			const spec = {
				openapi: "3.0.0",
				info: {
					title: "Test API",
					version: "1.0.0",
				},
				paths: {},
			};

			const result = await parseSpecFromString(JSON.stringify(spec));

			assert.ok(result);
			assert.ok(result.document);
			assert.strictEqual(result.document.info.title, "Test API");
			assert.strictEqual(result.document.info.version, "1.0.0");
		});

		it("should parse petstore-like spec", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec));

			assert.ok(result);
			assert.ok(result.isOpenAPI3);
			assert.strictEqual(result.version, "3.0.0");
			assert.strictEqual(result.document.info.title, "Petstore API");
		});

		it("should extract paths from spec", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec));
			const paths = getPaths(result.document);

			assert.ok(paths);
			assert.ok(Object.keys(paths).length > 0);
			assert.ok(paths["/pets"]);
		});

		it("should extract components/schemas from spec", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec));
			const schemas = getSchemas(result.document);

			assert.ok(schemas);
			assert.ok(schemas.Pet);
		});

		it("should dereference $ref", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec), {
				dereference: true,
			});

			// After dereferencing, the Pet schema should be resolved
			const schemas = getSchemas(result.document);
			const petSchema = schemas.Pet;
			assert.ok(petSchema);
			assert.ok("properties" in petSchema);
			assert.ok(petSchema.properties?.id);
			assert.ok(petSchema.properties?.name);
		});

		it("should detect OpenAPI version", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec));

			assert.strictEqual(result.isOpenAPI3, true);
			assert.strictEqual(result.isOpenAPI31, false);
			assert.strictEqual(result.isSwagger2, false);
			assert.strictEqual(result.version, "3.0.0");
		});
	});

	describe("validation", () => {
		it("should validate a valid OpenAPI spec", async () => {
			// parseSpecFromString with validate: true (default) should not throw
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec), {
				validate: true,
			});

			assert.ok(result);
			assert.ok(result.document);
		});

		it("should throw for invalid spec when validation enabled", async () => {
			const invalidSpec = {
				openapi: "3.0.0",
				// Missing required 'info' field
				paths: {},
			};

			await assert.rejects(
				async () =>
					parseSpecFromString(JSON.stringify(invalidSpec), { validate: true }),
				// Swagger parser throws an error for invalid specs
				(err: Error) => err !== null,
			);
		});

		it("should parse invalid spec when validation disabled", async () => {
			const invalidSpec = {
				openapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" },
				paths: {},
			};

			const result = await parseSpecFromString(JSON.stringify(invalidSpec), {
				validate: false,
			});

			assert.ok(result);
		});
	});

	describe("type guards", () => {
		it("should identify OpenAPI 3.x documents", async () => {
			const result = await parseSpecFromString(JSON.stringify(petstoreSpec));

			assert.strictEqual(isOpenAPI3(result.document), true);
			assert.strictEqual(isOpenAPI31(result.document), false);
		});

		it("should identify OpenAPI 3.1 documents", async () => {
			const spec31 = {
				openapi: "3.1.0",
				info: {
					title: "OpenAPI 3.1 API",
					version: "1.0.0",
				},
				paths: {},
			};

			const result = await parseSpecFromString(JSON.stringify(spec31), {
				validate: false,
			});

			assert.strictEqual(isOpenAPI3(result.document), true);
			assert.strictEqual(isOpenAPI31(result.document), true);
		});
	});

	describe("Edge cases", () => {
		it("should handle spec with no paths", async () => {
			const spec = {
				openapi: "3.0.0",
				info: {
					title: "Empty API",
					version: "1.0.0",
				},
				paths: {},
			};

			const result = await parseSpecFromString(JSON.stringify(spec));
			const paths = getPaths(result.document);

			assert.ok(result);
			assert.deepStrictEqual(paths, {});
		});

		it("should handle spec with components but no schemas", async () => {
			const spec = {
				openapi: "3.0.0",
				info: {
					title: "No Schema API",
					version: "1.0.0",
				},
				paths: {},
				components: {},
			};

			const result = await parseSpecFromString(JSON.stringify(spec));
			const schemas = getSchemas(result.document);

			assert.ok(result);
			assert.deepStrictEqual(schemas, {});
		});

		it("should handle spec with servers", async () => {
			const spec = {
				openapi: "3.0.0",
				info: {
					title: "Server API",
					version: "1.0.0",
				},
				servers: [
					{ url: "https://api.example.com/v1" },
					{ url: "https://staging.example.com/v1" },
				],
				paths: {},
			};

			const result = await parseSpecFromString(JSON.stringify(spec));
			const servers = getServers(result.document);

			assert.ok(servers);
			assert.strictEqual(servers.length, 2);
			assert.strictEqual(servers[0].url, "https://api.example.com/v1");
		});

		it("should handle spec with security schemes", async () => {
			const spec = {
				openapi: "3.0.0",
				info: {
					title: "Secure API",
					version: "1.0.0",
				},
				paths: {},
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
						},
						apiKey: {
							type: "apiKey",
							in: "header",
							name: "X-API-Key",
						},
					},
				},
			};

			const result = await parseSpecFromString(JSON.stringify(spec));
			const securitySchemes = getSecuritySchemes(result.document);

			assert.ok(securitySchemes);
			assert.ok(securitySchemes.bearerAuth);
			assert.ok(securitySchemes.apiKey);
		});
	});
});
