/**
 * Generator tests
 * Tests for generator metadata, type mappings, and reserved words
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	createGoMetadata,
	createPhpMetadata,
	createPythonMetadata,
	createTypescriptFetchMetadata,
	getGenerator,
	hasGenerator,
	listGenerators,
} from "./index.js";

describe("Generator Registry", () => {
	it("should list all available generators", () => {
		const generators = listGenerators();
		assert.ok(generators.includes("typescript-fetch"));
		assert.ok(generators.includes("typescript"));
		assert.ok(generators.includes("python"));
		assert.ok(generators.includes("go"));
		assert.ok(generators.includes("php"));
	});

	it("should check if generator exists", () => {
		assert.strictEqual(hasGenerator("typescript-fetch"), true);
		assert.strictEqual(hasGenerator("python"), true);
		assert.strictEqual(hasGenerator("go"), true);
		assert.strictEqual(hasGenerator("php"), true);
		assert.strictEqual(hasGenerator("nonexistent"), false);
	});

	it("should get generator by name", () => {
		const tsGenerator = getGenerator("typescript-fetch");
		assert.ok(tsGenerator);
		assert.strictEqual(tsGenerator.name, "typescript-fetch");
		assert.strictEqual(tsGenerator.language, "TypeScript");
	});

	it("should return undefined for nonexistent generator", () => {
		const generator = getGenerator("nonexistent");
		assert.strictEqual(generator, undefined);
	});
});

describe("TypeScript Fetch Generator", () => {
	const metadata = createTypescriptFetchMetadata();

	it("should have correct metadata", () => {
		assert.strictEqual(metadata.name, "typescript-fetch");
		assert.strictEqual(metadata.type, "client");
		assert.strictEqual(metadata.language, "TypeScript");
		assert.strictEqual(metadata.modelFileExtension, ".ts");
		assert.strictEqual(metadata.apiFileExtension, ".ts");
	});

	it("should have correct type mappings", () => {
		const typeMappings = metadata.defaultTypeMappings;
		assert.strictEqual(typeMappings.integer, "number");
		assert.strictEqual(typeMappings.long, "number");
		assert.strictEqual(typeMappings.float, "number");
		assert.strictEqual(typeMappings.double, "number");
		assert.strictEqual(typeMappings.string, "string");
		assert.strictEqual(typeMappings.boolean, "boolean");
		assert.strictEqual(typeMappings.binary, "Blob");
		assert.strictEqual(typeMappings.file, "File");
		assert.strictEqual(typeMappings.array, "Array");
		assert.strictEqual(typeMappings.object, "object");
	});

	it("should have reserved words", () => {
		const reservedWords = metadata.reservedWords;
		assert.ok(reservedWords.has("class"));
		assert.ok(reservedWords.has("function"));
		assert.ok(reservedWords.has("return"));
		assert.ok(reservedWords.has("const"));
		assert.ok(reservedWords.has("let"));
		assert.ok(reservedWords.has("interface"));
		assert.ok(reservedWords.has("type"));
	});

	it("should have supporting files", () => {
		assert.ok(metadata.supportingFiles.length > 0);
		const fileNames = metadata.supportingFiles.map(
			(f) => f.destinationFilename,
		);
		assert.ok(fileNames.includes("index.ts"));
		assert.ok(fileNames.includes("runtime.ts"));
		assert.ok(fileNames.includes("configuration.ts"));
	});

	it("should have libraries defined", () => {
		assert.ok(metadata.libraries?.includes("default"));
		assert.strictEqual(metadata.defaultLibrary, "default");
	});
});

describe("Python Generator", () => {
	const metadata = createPythonMetadata();

	it("should have correct metadata", () => {
		assert.strictEqual(metadata.name, "python");
		assert.strictEqual(metadata.type, "client");
		assert.strictEqual(metadata.language, "Python");
		assert.strictEqual(metadata.modelFileExtension, ".py");
		assert.strictEqual(metadata.apiFileExtension, ".py");
	});

	it("should have correct type mappings", () => {
		const typeMappings = metadata.defaultTypeMappings;
		assert.strictEqual(typeMappings.integer, "int");
		assert.strictEqual(typeMappings.long, "int");
		assert.strictEqual(typeMappings.float, "float");
		assert.strictEqual(typeMappings.string, "str");
		assert.strictEqual(typeMappings.boolean, "bool");
		assert.strictEqual(typeMappings.array, "List");
		assert.strictEqual(typeMappings.map, "Dict");
	});

	it("should have Python reserved words", () => {
		const reservedWords = metadata.reservedWords;
		assert.ok(reservedWords.has("and"));
		assert.ok(reservedWords.has("or"));
		assert.ok(reservedWords.has("not"));
		assert.ok(reservedWords.has("def"));
		assert.ok(reservedWords.has("class"));
		assert.ok(reservedWords.has("import"));
		assert.ok(reservedWords.has("from"));
		assert.ok(reservedWords.has("async"));
		assert.ok(reservedWords.has("await"));
		assert.ok(reservedWords.has("True"));
		assert.ok(reservedWords.has("False"));
		assert.ok(reservedWords.has("None"));
	});

	it("should have pydantic-specific reserved words", () => {
		const reservedWords = metadata.reservedWords;
		assert.ok(reservedWords.has("field"));
	});

	it("should have import mappings", () => {
		const importMappings = metadata.defaultImportMappings;
		assert.strictEqual(importMappings.datetime, "datetime");
		assert.strictEqual(importMappings.date, "datetime");
		assert.strictEqual(importMappings.Decimal, "decimal");
	});

	it("should have libraries defined", () => {
		assert.ok(metadata.libraries?.includes("urllib3"));
		assert.ok(metadata.libraries?.includes("asyncio"));
		assert.ok(metadata.libraries?.includes("httpx"));
		assert.strictEqual(metadata.defaultLibrary, "urllib3");
	});
});

describe("Go Generator", () => {
	const metadata = createGoMetadata();

	it("should have correct metadata", () => {
		assert.strictEqual(metadata.name, "go");
		assert.strictEqual(metadata.type, "client");
		assert.strictEqual(metadata.language, "Go");
		assert.strictEqual(metadata.modelFileExtension, ".go");
		assert.strictEqual(metadata.apiFileExtension, ".go");
	});

	it("should have correct type mappings", () => {
		const typeMappings = metadata.defaultTypeMappings;
		assert.strictEqual(typeMappings.integer, "int32");
		assert.strictEqual(typeMappings.long, "int64");
		assert.strictEqual(typeMappings.float, "float32");
		assert.strictEqual(typeMappings.double, "float64");
		assert.strictEqual(typeMappings.boolean, "bool");
		assert.strictEqual(typeMappings.string, "string");
		assert.strictEqual(typeMappings.DateTime, "time.Time");
		assert.strictEqual(typeMappings.File, "*os.File");
		assert.strictEqual(typeMappings.object, "map[string]interface{}");
		assert.strictEqual(typeMappings.AnyType, "interface{}");
	});

	it("should have Go reserved words", () => {
		const reservedWords = metadata.reservedWords;
		// Keywords
		assert.ok(reservedWords.has("func"));
		assert.ok(reservedWords.has("interface"));
		assert.ok(reservedWords.has("struct"));
		assert.ok(reservedWords.has("map"));
		assert.ok(reservedWords.has("chan"));
		assert.ok(reservedWords.has("go"));
		assert.ok(reservedWords.has("defer"));
		assert.ok(reservedWords.has("select"));
		assert.ok(reservedWords.has("range"));
		assert.ok(reservedWords.has("nil"));
		assert.ok(reservedWords.has("error"));
		// Data types
		assert.ok(reservedWords.has("int"));
		assert.ok(reservedWords.has("int32"));
		assert.ok(reservedWords.has("int64"));
		assert.ok(reservedWords.has("float32"));
		assert.ok(reservedWords.has("float64"));
		assert.ok(reservedWords.has("bool"));
		assert.ok(reservedWords.has("string"));
	});

	it("should have import mappings", () => {
		const importMappings = metadata.defaultImportMappings;
		assert.strictEqual(importMappings["time.Time"], "time");
		assert.strictEqual(importMappings["*os.File"], "os");
	});

	it("should have supporting files for go.mod", () => {
		const fileNames = metadata.supportingFiles.map(
			(f) => f.destinationFilename,
		);
		assert.ok(fileNames.includes("go.mod"));
		assert.ok(fileNames.includes("go.sum"));
		assert.ok(fileNames.includes("client.go"));
		assert.ok(fileNames.includes("configuration.go"));
	});
});

describe("PHP Generator", () => {
	const metadata = createPhpMetadata();

	it("should have correct metadata", () => {
		assert.strictEqual(metadata.name, "php");
		assert.strictEqual(metadata.type, "client");
		assert.strictEqual(metadata.language, "PHP");
		assert.strictEqual(metadata.modelFileExtension, ".php");
		assert.strictEqual(metadata.apiFileExtension, ".php");
	});

	it("should have correct type mappings", () => {
		const typeMappings = metadata.defaultTypeMappings;
		assert.strictEqual(typeMappings.integer, "int");
		assert.strictEqual(typeMappings.long, "int");
		assert.strictEqual(typeMappings.float, "float");
		assert.strictEqual(typeMappings.double, "float");
		assert.strictEqual(typeMappings.string, "string");
		assert.strictEqual(typeMappings.boolean, "bool");
		assert.strictEqual(typeMappings.date, "\\DateTime");
		assert.strictEqual(typeMappings.DateTime, "\\DateTime");
		assert.strictEqual(typeMappings.file, "\\SplFileObject");
		assert.strictEqual(typeMappings.array, "array");
		assert.strictEqual(typeMappings.object, "object");
		assert.strictEqual(typeMappings.AnyType, "mixed");
	});

	it("should have PHP reserved words", () => {
		const reservedWords = metadata.reservedWords;
		assert.ok(reservedWords.has("abstract"));
		assert.ok(reservedWords.has("class"));
		assert.ok(reservedWords.has("function"));
		assert.ok(reservedWords.has("interface"));
		assert.ok(reservedWords.has("trait"));
		assert.ok(reservedWords.has("public"));
		assert.ok(reservedWords.has("private"));
		assert.ok(reservedWords.has("protected"));
		assert.ok(reservedWords.has("namespace"));
		assert.ok(reservedWords.has("use"));
		assert.ok(reservedWords.has("echo"));
		assert.ok(reservedWords.has("print"));
	});

	it("should have API method local variables as reserved", () => {
		const reservedWords = metadata.reservedWords;
		assert.ok(reservedWords.has("resourcePath"));
		assert.ok(reservedWords.has("httpBody"));
		assert.ok(reservedWords.has("queryParams"));
		assert.ok(reservedWords.has("headerParams"));
		assert.ok(reservedWords.has("formParams"));
	});

	it("should have libraries defined", () => {
		assert.ok(metadata.libraries?.includes("guzzle"));
		assert.ok(metadata.libraries?.includes("psr-18"));
		assert.strictEqual(metadata.defaultLibrary, "guzzle");
	});

	it("should have supporting files for composer", () => {
		const fileNames = metadata.supportingFiles.map(
			(f) => f.destinationFilename,
		);
		assert.ok(fileNames.includes("composer.json"));
		assert.ok(fileNames.includes("ApiException.php"));
		assert.ok(fileNames.includes("Configuration.php"));
	});
});
