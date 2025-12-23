# Agent Guidelines for OpenAPI Generator TypeScript Port

TypeScript port of [OpenAPI Generator](https://github.com/openapi-generator-tech/openapi-generator). Generates client code from OpenAPI specs using Handlebars templates.

## Architecture

```
src/
  cli/           # CLI (Node's native util.parseArgs)
  core/          # Generator engine and configuration
  generators/    # Language-specific generators (typescript-fetch, python, go, php)
  models/        # CodegenModel, CodegenOperation, CodegenProperty, etc.
  parser/        # OpenAPI parsing (@apidevtools/swagger-parser)
  template/      # Handlebars engine and lambda functions
```

## Commands

```bash
npm run build              # Compile TypeScript
npm test                   # Lint, typecheck, unit tests, build samples
npm run test:unit          # Unit tests only
npm run sync-templates     # Sync templates from original Java project
npm run lint / npm run fix # Biome linting

# CLI
npx tsx src/cli/index.ts generate -i spec.yaml -g typescript-fetch -o output/

# Samples
cd samples && make typescript-fetch
```

## Porting a Generator

1. **Find Java source**: `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/`
2. **Extract**: reserved words, type mappings, import mappings, supporting files
3. **Create** `src/generators/{language}.ts` with `createMetadata()` and `getAdditionalProperties()`
4. **Register** in `src/generators/index.ts`
5. **Sync templates**: Add to `GENERATOR_CONFIGS` in `scripts/sync-templates.sh`

## Templates

Templates in `templates/{generator}/`. Synced from original Java project with automatic conversion:

- `{{=<% %>=}}` delimiter changes → removed
- `{{#lambda.func}}` → `{{#func}}`
- `{{{{var}}}}` quad-braces → proper escaping for JSDoc

**⚠️ CRITICAL: Never manually edit templates!**

Templates are synced from upstream and converted automatically. All template fixes must be made in `src/cli/convert-template.ts` to ensure the process is reproducible. After updating the converter, re-run `npm run sync-templates:clean` to regenerate all templates.

**Handlebars vs Mustache differences:**

- String conditionals: Use `{{#if returnType}}` not `{{#returnType}}`
- Nested access: Use `{{../classname}}` for parent context
- Convert templates: `npx tsx src/cli/convert-template.ts input.mustache output.mustache`

## Comparing Output

```bash
# Generate with original
npx @openapitools/openapi-generator-cli generate \
  -i samples/petstore.yaml -g typescript-fetch -o tmp/original-output

# Generate with this port
cd samples && make typescript-fetch

# Compare
diff -r tmp/original-output samples/build/typescript-fetch
```

**Common issues:**
| Issue | Fix Location |
|-------|--------------|
| Empty names | `src/core/generator.ts` - check operation context |
| Wrong types | `src/parser/operation-transformer.ts` - $ref resolution |
| Missing imports | Template or generator |
| Undefined vars | Template - use `../varName` for parent context |

## Available Generators

`typescript-fetch`, `python`, `go`, `php`

## Lambda Functions

String: `lowercase`, `uppercase`, `camelcase`, `pascalcase`, `snakecase`, `kebabcase`
Other: `capitalizeFirst`, `doublequote`, `indent`, `indent4`, `indent8`

## ESM Note

Use `.js` extensions in imports: `import { x } from './module.js'`
