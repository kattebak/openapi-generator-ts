/**
 * Generator registry
 */
import type { CodegenConfig, GeneratorMetadata } from "../core/config.js";
import { createGoMetadata, getGoAdditionalProperties } from "./go.js";
import { createPhpMetadata, getPhpAdditionalProperties } from "./php.js";
import { createPythonMetadata, getPythonAdditionalProperties } from "./python.js";
import {
	createTypescriptFetchMetadata,
	getTypescriptAdditionalProperties,
} from "./typescript-fetch.js";

export * from "./go.js";
export * from "./php.js";
export * from "./python.js";
export * from "./typescript-fetch.js";

/**
 * Registry of available generators
 */
const generators = new Map<string, () => GeneratorMetadata>();
const additionalPropertiesProviders = new Map<
	string,
	(config: CodegenConfig) => Record<string, unknown>
>();

// Register built-in generators
generators.set("typescript-fetch", createTypescriptFetchMetadata);
generators.set("typescript", createTypescriptFetchMetadata); // Alias
generators.set("python", createPythonMetadata);
generators.set("go", createGoMetadata);
generators.set("php", createPhpMetadata);

// Register additional properties providers
additionalPropertiesProviders.set("go", getGoAdditionalProperties);
additionalPropertiesProviders.set(
	"typescript-fetch",
	getTypescriptAdditionalProperties,
);
additionalPropertiesProviders.set("typescript", getTypescriptAdditionalProperties);
additionalPropertiesProviders.set("python", getPythonAdditionalProperties);
additionalPropertiesProviders.set("php", getPhpAdditionalProperties);

/**
 * Get a generator by name
 */
export function getGenerator(name: string): GeneratorMetadata | undefined {
	const factory = generators.get(name);
	return factory?.();
}

/**
 * Get additional properties for a generator
 */
export function getGeneratorAdditionalProperties(
	name: string,
	config: CodegenConfig,
): Record<string, unknown> {
	const provider = additionalPropertiesProviders.get(name);
	return provider ? provider(config) : {};
}

/**
 * List all available generators
 */
export function listGenerators(): string[] {
	return Array.from(generators.keys());
}

/**
 * Register a custom generator
 */
export function registerGenerator(
	name: string,
	factory: () => GeneratorMetadata,
): void {
	generators.set(name, factory);
}

/**
 * Check if a generator exists
 */
export function hasGenerator(name: string): boolean {
	return generators.has(name);
}
