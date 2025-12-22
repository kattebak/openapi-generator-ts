# Agent Guidelines for OpenAPI Generator TypeScript Port

This document provides context and guidance for LLMs working on the `@kattebak/openapi-generator-ts` package.

## Project Overview

This package is a TypeScript port of the Java [OpenAPI Generator](https://github.com/openapi-generator-tech/openapi-generator). It generates client code from OpenAPI specifications using Handlebars templates.

### Key Architecture

```
src/
  cli/           # CLI using Node's native `util.parseArgs`
  core/          # Generator engine and configuration
  generators/    # Language-specific generators (typescript-fetch, python, go, php)
  models/        # Codegen data models (CodegenModel, CodegenOperation, etc.)
  parser/        # OpenAPI spec parsing with @apidevtools/swagger-parser
  template/      # Handlebars engine and lambda functions
```

## How to Port a Generator from Java

### 1. Locate the Java Source Files

Generators are in:
```
modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/
```

Most generators extend an abstract base class:
- `TypeScriptFetchClientCodegen` extends `AbstractTypeScriptClientCodegen`
- `PythonClientCodegen` extends `AbstractPythonCodegen`
- `GoClientCodegen` extends `AbstractGoCodegen`
- `PhpClientCodegen` extends `AbstractPhpCodegen`

### 2. Extract Key Information

From the Java files, extract:

1. **Reserved Words** - Look for `setReservedWordsLowerCase()` or `reservedWords` initialization
2. **Type Mappings** - Look for `typeMapping.put()` calls
3. **Import Mappings** - Look for `importMapping.put()` calls
4. **Supporting Files** - Look for `supportingFiles.add(new SupportingFile(...))` calls
5. **Additional Properties** - Look for `additionalProperties.put()` calls

### 3. Create the Generator File

Create `src/generators/{language}.ts` with:

```typescript
import type { GeneratorMetadata, CodegenConfig } from '../core/config.js';

const RESERVED_WORDS = new Set([...]);
const TYPE_MAPPINGS: Record<string, string> = {...};
const IMPORT_MAPPINGS: Record<string, string> = {...};

export function createMetadata(): GeneratorMetadata {
  return {
    name: 'language',
    description: 'Generates Language client code',
    type: 'client',
    language: 'Language',
    libraries: ['default'],
    defaultLibrary: 'default',
    embeddedTemplateDir: 'language',
    modelFileExtension: '.ext',
    apiFileExtension: '.ext',
    modelTemplateFile: 'model.mustache',
    apiTemplateFile: 'api.mustache',
    supportingFiles: [...],
    reservedWords: RESERVED_WORDS,
    defaultTypeMappings: TYPE_MAPPINGS,
    defaultImportMappings: IMPORT_MAPPINGS,
  };
}

export function getAdditionalProperties(config: CodegenConfig): Record<string, unknown> {
  return {
    // Default properties from Java
    ...config.additionalProperties,
  };
}
```

### 4. Register the Generator

Add to `src/generators/index.ts`:

```typescript
import { createMetadata } from './language.js';
export * from './language.js';
generators.set('language', createMetadata);
```

### 5. Templates

Templates are located in:
```
modules/openapi-generator/src/main/resources/{generator-name}/
```

The original Mustache templates are mostly compatible with Handlebars, but there are differences:

| Feature | Java Mustache | Handlebars |
|---------|---------------|------------|
| Lambdas | `{{#lambda.camelcase}}text{{/lambda.camelcase}}` | `{{#camelcase}}text{{/camelcase}}` |
| Delimiter changing | `{{=<% %>=}}` | Not supported |

### 6. Syncing Templates from Original

Templates are synced from the original Java project using a script that:
1. Does a shallow clone of the original repository
2. Copies templates for configured generators
3. Converts Mustache syntax to Handlebars-compatible format

```bash
# Sync all configured generators
npm run sync-templates

# Sync specific generators
./scripts/sync-templates.sh -g go,python

# Clean and re-sync
npm run sync-templates:clean

# Dry run to see what would be done
./scripts/sync-templates.sh --dry-run
```

To add a new generator to the sync, edit `scripts/sync-templates.sh` and add an entry to `GENERATOR_CONFIGS`:

```bash
declare -A GENERATOR_CONFIGS=(
  ["new-generator"]="new-generator:new-generator"  # source_dir:target_dir
  # ... existing generators
)
```

The sync script automatically handles:
- Removing `{{=<% %>=}}` delimiter changes
- Converting `{{#lambda.funcName}}` to `{{#funcName}}`
- Converting `{{lambda.funcName}}` to `{{funcName}}`

## Lambda Functions

Lambda functions are in `src/template/lambdas/`. Available functions:

- **String transforms**: `lowercase`, `uppercase`, `camelcase`, `pascalcase`, `snakecase`, `kebabcase`, `screamingSnakecase`, `titlecase`
- **Character ops**: `capitalizeFirst`, `lowercaseFirst`, `uncamelize`
- **Quoting**: `doublequote`, `singlequote`, `escapeDoubleQuotes`, `escapeSingleQuotes`
- **Paths**: `forwardslash`, `backslash`
- **Indentation**: `indent`, `indent4`, `indent8`, `indentTab`

## Data Models

The core data models mirror the Java implementation:

- **CodegenModel** - Represents a schema/model with properties, inheritance, etc.
- **CodegenOperation** - Represents an API operation with parameters, responses, etc.
- **CodegenProperty** - Represents a model property
- **CodegenParameter** - Represents an operation parameter
- **CodegenResponse** - Represents an API response
- **CodegenSecurity** - Represents security schemes

## Testing

Tests use Node.js's built-in test runner with native TypeScript support:

```bash
npm test                    # Run all checks (lint, typecheck, unit tests, build samples)
npm run test:unit           # Run unit tests only
npm run test:unit:verbose   # Run unit tests with detailed output
npm run test:build-samples  # Build all sample generators
```

Test files are co-located with source files using the `.test.ts` suffix.

### Sample Generators

The `samples/` directory contains a Makefile to generate sample clients from the Petstore OpenAPI spec:

```bash
cd samples
make all              # Build all samples
make typescript-fetch # Build specific generator
make clean            # Clean generated output
```

Generated code goes to `samples/build/<generator-name>/`.

## Common Patterns

### Type Mappings

Java:
```java
typeMapping.put("integer", "int");
typeMapping.put("array", "List");
```

TypeScript:
```typescript
const TYPE_MAPPINGS: Record<string, string> = {
  integer: 'int',
  array: 'List',
};
```

### Reserved Words

Java:
```java
reservedWords = new HashSet<>(Arrays.asList("and", "or", "not"));
```

TypeScript:
```typescript
const RESERVED_WORDS = new Set(['and', 'or', 'not']);
```

### Supporting Files

Java:
```java
supportingFiles.add(new SupportingFile("api_client.mustache", packagePath(), "api_client.py"));
```

TypeScript:
```typescript
supportingFiles: [
  {
    templateFile: 'api_client.mustache',
    folder: '{{packageName}}',
    destinationFilename: 'api_client.py',
  },
],
```

## Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
npm run lint   # Check for issues
npm run fix    # Auto-fix issues
```

Configuration is in `biome.json`. Key settings:
- Tabs for indentation
- Double quotes for strings
- Recommended lint rules enabled

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to main:
- Lint check
- Type check
- Unit tests
- Sample builds
- Semantic release (on main branch pushes)

## Key Dependencies

- `@apidevtools/swagger-parser` - OpenAPI parsing and dereferencing
- `handlebars` - Template engine (Mustache-compatible)
- `es-toolkit` - String transformation utilities (camelCase, snakeCase, etc.)
- `fast-glob` - File pattern matching
- `fs-extra` - Enhanced file system operations
- `@biomejs/biome` - Linting and formatting (dev)

## CLI

The CLI uses Node's native `util.parseArgs` (not commander). The binary is `ts-openapi-generator`:

```bash
ts-openapi-generator list                           # List generators
ts-openapi-generator validate -i spec.yaml          # Validate spec
ts-openapi-generator generate -i spec.yaml -g go -o output/  # Generate code
```

For development (without building):
```bash
npx tsx src/cli/index.ts generate -i spec.yaml -g go -o output/
```

## ESM Notes

This is an ESM package. For `__dirname` equivalent:

```typescript
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Documentation

- `doc/README.md` - Architecture overview
- `doc/generators.md` - Generator documentation
- `doc/porting-guide.md` - Detailed porting guide

## Parser Functions

The OpenAPI parser (`src/parser/openapi-parser.ts`) provides:

- `parseSpec(path, options)` - Parse spec from file path or URL
- `parseSpecFromString(content, options)` - Parse spec from JSON/YAML string
- `getSchemas(document)` - Extract schemas from parsed document
- `getPaths(document)` - Extract paths/operations
- `getSecuritySchemes(document)` - Extract security schemes
- `getServers(document)` - Extract server URLs
- `isOpenAPI3(document)` - Type guard for OpenAPI 3.x
- `isOpenAPI31(document)` - Type guard for OpenAPI 3.1

## Test Patterns

Tests use Node.js built-in test runner with tsx for TypeScript:

```bash
npm test                    # Run all tests
npm run test:verbose        # Detailed output with spec reporter
```

Test files are co-located with source using `.test.ts` suffix. Example patterns:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('FeatureName', () => {
  it('should do something', () => {
    assert.strictEqual(actual, expected);
  });
});
```

For generator tests, verify:
- Metadata completeness (name, type, language)
- Reserved words include language keywords
- Type mappings cover OpenAPI types
- Supporting files are defined

## Available Generators

Currently ported:
- `typescript-fetch` - TypeScript with Fetch API
- `python` - Python client
- `go` - Go client
- `php` - PHP client (with guzzle and psr-18 libraries)

## Troubleshooting

### ESM Import Issues
Always use `.js` extensions in imports, even for TypeScript files:
```typescript
import { something } from './module.js';  // Correct
import { something } from './module.ts';  // Wrong - not allowed
```

The tsx loader handles resolution from `.js` to `.ts` at runtime.

### Handlebars vs Mustache
When porting templates from Java:
- Remove delimiter changes (`{{=<% %>=}}`)
- Convert lambda syntax: `{{#lambda.func}}` → `{{#func}}`
- Handlebars helpers return strings, not booleans in templates

---

## Maintaining This Document

**Important:** After completing major work (new features, architectural changes, new tooling, etc.), review this document and update it if needed. This ensures future agents have accurate context.

Things to check after major changes:
- Are the npm scripts still accurate?
- Are the CLI commands correct?
- Are there new directories or files that should be documented?
- Have any dependencies been added or removed?
- Are the test commands up to date?
- Has the CI/CD pipeline changed?
