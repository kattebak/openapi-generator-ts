# Maintenance Guide

This guide covers routine maintenance tasks for the OpenAPI Generator TypeScript port.

## Template Synchronization

We sync templates from the upstream [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) Java project to ensure our generators stay up-to-date.

### 1. Preparation

Ensure the sync script is up to date. The script `scripts/sync-templates.sh` contains the configuration for which generators to sync.

```bash
# Check GENERATOR_CONFIGS in the script
cat scripts/sync-templates.sh
```

### 2. Execution

Run the sync command:

```bash
npm run sync-templates
```

This command will:

1. Clone/update the original OpenAPI Generator repository in `tmp/openapi-generator`.
2. Copy the latest templates from the Java project to `templates/{generator}/`.
3. Convert Mustache syntax to Handlebars-compatible format (e.g., `{{#lambda.func}}` -> `{{#func}}`).
4. Apply automatic transformations (delimiter changes, etc.).

### 3. Validation

After syncing, verify the changes:

1. **Inspect converted templates**: Check for any remaining Mustache-specific syntax that Handlebars might not handle (though the converter handles most cases).
2. **Run tests**: Ensure the template converter didn't break anything.
   ```bash
   npm run test:unit -- --grep "convert-template"
   ```
3. **Regenerate samples**: Run the generators to ensure the new templates work.
   ```bash
   cd samples
   make all
   ```

## Debugging & Comparison

To verify that our port generates output identical (or close to) the original Java generator, we use a comparison workflow.

### 1. Generate Reference Output

You need the Java-based CLI installed:

```bash
npm install -g @openapitools/openapi-generator-cli
```

Generate the reference output for a specific generator (e.g., `go`):

```bash
mkdir -p tmp/original-output
npx @openapitools/openapi-generator-cli generate \
  -i samples/petstore.yaml \
  -g go \
  -o tmp/original-output/go
```

### 2. Generate Port Output

Generate the output using our TypeScript port:

```bash
npx tsx src/cli/index.ts generate \
  -i samples/petstore.yaml \
  -g go \
  -o samples/build/go
```

### 3. Compare

Use the comparison script to see the differences:

```bash
./scripts/compare-outputs.sh
```

This script will generate diff reports in `tmp/comparison-reports/`.

## Tracking Discrepancies

Known issues and discrepancies are tracked in [discrepancies-tracker.md](./discrepancies-tracker.md). Update this file when you find new issues or fix existing ones.
