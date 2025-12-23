# @kattebak/openapi-generator-ts

A TypeScript port of the excellent [OpenAPI Generator](https://openapi-generator.tech/) project.

## Acknowledgments

This project stands on the shoulders of giants. The original [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) is a remarkable open-source project that has generated API clients, server stubs, and documentation for countless developers worldwide. We are deeply grateful to the OpenAPI Generator community for their years of work building and maintaining such a comprehensive and well-designed tool.

## Motivation

While the original OpenAPI Generator is feature-complete and battle-tested, it requires a Java Virtual Machine (JVM) to run. This can be inconvenient in certain scenarios:

- **CI/CD pipelines** where adding a JVM dependency increases container image sizes and build times
- **Node.js-only environments** where maintaining a Java installation adds operational complexity
- **Quick local generation** where startup time matters

This TypeScript port provides a native Node.js alternative that:

- Eliminates the JVM dependency entirely
- Offers faster startup times for small to medium specs
- Integrates seamlessly into JavaScript/TypeScript toolchains
- Uses the same Mustache-compatible templates as the original

**Note:** This is not a replacement for the original. If you need the full feature set, extensive generator library, or battle-tested stability, use the original [OpenAPI Generator](https://openapi-generator.tech/). This port focuses on common use cases with a subset of generators.

## Installation

```bash
npm install @kattebak/openapi-generator-ts
```

Or run directly with npx:

```bash
npx @kattebak/openapi-generator-ts generate -i api.yaml -g typescript-fetch -o ./generated
```

## Usage

### CLI

```bash
# List available generators
openapi-generator list

# Validate an OpenAPI specification
openapi-generator validate -i openapi.yaml

# Generate client code
openapi-generator generate -i openapi.yaml -g typescript-fetch -o ./output

# Generate with additional properties
openapi-generator generate -i openapi.yaml -g python -o ./output \
  --additional-properties packageName=my_api,packageVersion=1.0.0
```

### Programmatic API

```typescript
import { generate, parseSpec } from '@kattebak/openapi-generator-ts';

// Parse and validate a spec
const { document } = await parseSpec('./openapi.yaml');

// Generate code
await generate({
  inputSpec: './openapi.yaml',
  generatorName: 'typescript-fetch',
  outputDir: './generated',
  additionalProperties: {
    npmName: '@myorg/api-client',
    npmVersion: '1.0.0',
  },
});
```

## Available Generators

| Generator | Language | Description |
|-----------|----------|-------------|
| `typescript-fetch` | TypeScript | Client using the Fetch API |
| `python` | Python | Python client with urllib3 |
| `go` | Go | Go client with net/http |
| `php` | PHP | PHP client (guzzle or psr-18) |

## Configuration

### Generator Options

Each generator supports additional properties that can be passed via `--additional-properties` or the programmatic API:

**typescript-fetch:**
- `npmName` - NPM package name
- `npmVersion` - NPM package version
- `supportsES6` - Generate ES6 code (default: true)

**python:**
- `packageName` - Python package name
- `packageVersion` - Package version
- `packageUrl` - Package URL for setup.py

**go:**
- `packageName` - Go package name
- `packageVersion` - Package version
- `isGoSubmodule` - Generate as Go submodule

**php:**
- `packageName` - Composer package name
- `invokerPackage` - Root namespace
- `composerVendorName` - Composer vendor name

## Templates

This generator uses Handlebars templates that are largely compatible with the original Mustache templates. Custom templates can be provided via the `--template-dir` option.

### Syncing Templates from Original

Templates are synced from the original OpenAPI Generator repository. The sync script does a shallow clone and automatically converts Mustache syntax to Handlebars-compatible format:

```bash
# Sync templates for all generators
npm run sync-templates

# Sync specific generators only
./scripts/sync-templates.sh -g typescript-fetch,python

# Clean existing templates and re-sync
npm run sync-templates:clean

# Preview what would be synced (dry run)
./scripts/sync-templates.sh --dry-run
```

The sync script handles:
- Shallow cloning of the original repository (cached in `.template-cache/`)
- Removing Mustache delimiter changes (`{{=<% %>=}}`)
- Converting lambda syntax (`{{#lambda.func}}` to `{{#func}}`)

## Comparing Output to Original

To verify this port generates compatible output, you can compare against the original Java OpenAPI Generator:

```bash
# Generate with original (using Docker, no Java needed)
docker run --rm -v $(pwd):/local openapitools/openapi-generator-cli generate \
  -i /local/samples/petstore.yaml \
  -g typescript-fetch \
  -o /local/tmp/original-output

# Generate with this port
cd samples && make typescript-fetch

# Compare
diff -r tmp/original-output samples/build/typescript-fetch
```

For detailed comparison methodology and debugging tips, see [AGENTS.md](./AGENTS.md#comparing-output-against-original-java-generator).

## Requirements

- Node.js >= 22.0.0

## Development

```bash
# Install dependencies
npm install

# Sync templates from original OpenAPI Generator
npm run sync-templates

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

Apache-2.0 - Same as the original OpenAPI Generator.

## See Also

- [OpenAPI Generator](https://openapi-generator.tech/) - The original Java implementation
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) - The OpenAPI Specification
