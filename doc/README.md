# @kattebak/openapi-generator-ts Documentation

This documentation covers the TypeScript port of OpenAPI Generator, including:

- [Available Generators](./generators.md) - Documentation for each generator
- [Porting Guide](./porting-guide.md) - How to port generators from Java
- [Maintenance Guide](./maintenance.md) - Template syncing and comparison workflows
- [Discrepancies Tracker](./discrepancies-tracker.md) - Current status of generator fidelity

## Architecture Overview

The package follows a modular architecture:

```
src/
  cli/           # CLI commands using Node's native parseArgs
  core/          # Core generator engine, config, and types
  generators/    # Language-specific generators (typescript-fetch, python)
  models/        # Codegen data models (CodegenModel, CodegenOperation, etc.)
  parser/        # OpenAPI spec parsing and transformation
  template/      # Handlebars template engine and lambda functions
```

### Key Components

1. **Parser Layer** (`src/parser/`)
   - Uses `@apidevtools/swagger-parser` to parse and dereference OpenAPI specs
   - `schema-transformer.ts` converts OpenAPI schemas to `CodegenModel`
   - `operation-transformer.ts` converts operations to `CodegenOperation`

2. **Template Engine** (`src/template/`)
   - Handlebars-based templating with Mustache compatibility
   - Lambda functions for string transformations (camelCase, snake_case, etc.)
   - Template locator chain for resolution priority

3. **Generator Registry** (`src/generators/`)
   - Each generator provides metadata, type mappings, and reserved words
   - Generators use templates from the original Java implementation

4. **CLI** (`src/cli/`)
   - Built with Node 24's native `util.parseArgs`
   - Commands: `generate`, `validate`, `list`

## Template Resolution

Templates are resolved in this order:

1. User-specified template directory (`--template-dir`)
2. Generator-specific templates in the package
3. Original Java templates from the workspace

## Using the CLI

```bash
# List available generators
node dist/cli/index.js list

# Validate an OpenAPI spec
node dist/cli/index.js validate -i spec.yaml

# Generate code
node dist/cli/index.js generate -i spec.yaml -g typescript-fetch -o output/
```
