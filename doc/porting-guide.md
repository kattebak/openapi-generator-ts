# Porting Generators from Java

This guide explains how to port generators from the original Java OpenAPI Generator to this TypeScript implementation.

## Overview

Each Java generator consists of:
1. A codegen class extending `DefaultCodegen` or a language-specific abstract class
2. Mustache templates in `resources/{generator-name}/`
3. Type mappings, reserved words, and additional properties

## Step-by-Step Process

### Step 1: Locate the Java Generator

Generators are in:
```
modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/
```

For example:
- `TypeScriptFetchClientCodegen.java`
- `PythonClientCodegen.java`
- `AbstractPythonCodegen.java`

Look for the class hierarchy - most generators extend an abstract base class that contains shared logic.

### Step 2: Extract Reserved Words

Find the `reservedWords()` method or the `reservedWords` Set initialization:

```java
// Java example from AbstractPythonCodegen.java
reservedWords = new HashSet<>(Arrays.asList(
    "and", "del", "from", "not", "while", "as", "elif", ...
));
```

Convert to TypeScript:

```typescript
const PYTHON_RESERVED_WORDS = new Set([
  'and', 'del', 'from', 'not', 'while', 'as', 'elif', ...
]);
```

### Step 3: Extract Type Mappings

Find the `typeMapping` initialization in the constructor:

```java
// Java example
typeMapping.put("integer", "int");
typeMapping.put("float", "float");
typeMapping.put("string", "str");
```

Convert to TypeScript:

```typescript
const PYTHON_TYPE_MAPPINGS: Record<string, string> = {
  integer: 'int',
  float: 'float',
  string: 'str',
};
```

### Step 4: Extract Import Mappings

Find `importMapping` initialization:

```java
// Java example
importMapping.put("datetime", "datetime");
```

Convert to TypeScript:

```typescript
const PYTHON_IMPORT_MAPPINGS: Record<string, string> = {
  datetime: 'datetime',
};
```

### Step 5: Identify Template Files

Check the generator's template directory:
```
modules/openapi-generator/src/main/resources/{generator-name}/
```

Note the key template files:
- Model template (e.g., `model.mustache`, `modelGeneric.mustache`)
- API template (e.g., `api.mustache`, `apis.mustache`)
- Supporting files (configuration, package files, etc.)

### Step 6: Extract Supporting Files

Find `supportingFiles` additions in the constructor:

```java
// Java example
supportingFiles.add(new SupportingFile("api_client.mustache",
    packagePath(), "api_client.py"));
supportingFiles.add(new SupportingFile("configuration.mustache",
    packagePath(), "configuration.py"));
```

Convert to TypeScript:

```typescript
supportingFiles: [
  {
    templateFile: 'api_client.mustache',
    folder: '{{packageName}}',
    destinationFilename: 'api_client.py',
  },
  {
    templateFile: 'configuration.mustache',
    folder: '{{packageName}}',
    destinationFilename: 'configuration.py',
  },
],
```

### Step 7: Create the Generator Metadata

Create a new file in `src/generators/{generator-name}.ts`:

```typescript
import type { GeneratorMetadata, CodegenConfig } from '../core/config.js';

const RESERVED_WORDS = new Set([...]);
const TYPE_MAPPINGS: Record<string, string> = {...};
const IMPORT_MAPPINGS: Record<string, string> = {...};

export function createGeneratorMetadata(): GeneratorMetadata {
  return {
    name: 'generator-name',
    description: 'Generates X client code',
    type: 'client',
    language: 'Language',
    libraries: ['default'],
    defaultLibrary: 'default',
    embeddedTemplateDir: 'generator-name',
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

export function getAdditionalProperties(
  config: CodegenConfig
): Record<string, unknown> {
  return {
    // Default additional properties from Java's additionalProperties()
    ...config.additionalProperties,
  };
}
```

### Step 8: Register the Generator

Add to `src/generators/index.ts`:

```typescript
import { createGeneratorMetadata } from './generator-name.js';

export * from './generator-name.js';

// In the registration section:
generators.set('generator-name', createGeneratorMetadata);
```

### Step 9: Test the Generator

```bash
npm run build
node dist/cli/index.js list  # Verify it appears
node dist/cli/index.js generate -i petstore.yaml -g generator-name -o output/
```

## Key Differences from Java

### 1. Template Engine

Java uses a modified Mustache with custom lambdas. We use Handlebars which is Mustache-compatible but with some differences:

| Feature | Java Mustache | Handlebars |
|---------|---------------|------------|
| Lambdas | `{{#lambda.camelcase}}{{name}}{{/lambda.camelcase}}` | `{{#camelcase}}{{name}}{{/camelcase}}` or `{{camelcase name}}` |
| Delimiter changing | `{{=<% %>=}}` | Not supported - templates need conversion |
| Partials | `{{>partial}}` | Same |
| Conditionals | `{{#condition}}` | Same |

### 2. Lambda Functions

Java lambdas are methods on classes. Our lambdas are pure functions in `src/template/lambdas/`:

```typescript
// string-lambdas.ts
export function camelcase(text: string): string {
  return camelCase(text);
}
```

Available lambdas:
- `lowercase`, `uppercase`
- `camelcase`, `pascalcase`, `snakecase`, `kebabcase`
- `screamingSnakecase` (SCREAMING_SNAKE_CASE)
- `titlecase`, `capitalizeFirst`, `lowercaseFirst`
- `indent`, `indent4`, `indent8`, `indentTab`
- And more...

### 3. Additional Properties

Java uses `additionalProperties().put()`. We return them from a function:

```typescript
export function getAdditionalProperties(config: CodegenConfig): Record<string, unknown> {
  return {
    packageName: config.packageName ?? 'default_name',
    ...config.additionalProperties,
  };
}
```

## Common Patterns

### Handling Package Names

Java generators often have `toPackageName()` methods. Handle in additional properties:

```typescript
packageName: config.packageName ?? 'openapi_client',
projectName: (config.packageName ?? 'openapi_client').replace(/_/g, '-'),
```

### File Extensions

Set in metadata:

```typescript
modelFileExtension: '.py',
apiFileExtension: '.py',
```

### Library Variants

Some generators support multiple HTTP libraries:

```typescript
libraries: ['urllib3', 'asyncio', 'httpx'],
defaultLibrary: 'urllib3',
```

## Troubleshooting

### Template Delimiter Issues

If templates use `{{=<% %>=}}` to change delimiters (common in Ruby/PHP generators), you'll need to either:
1. Convert the template to use standard Handlebars syntax
2. Create new templates in `src/templates/{generator-name}/`

### Missing Lambdas

If a template uses a lambda not yet implemented, add it to `src/template/lambdas/`:

```typescript
// In string-lambdas.ts
export function myNewLambda(text: string): string {
  // Implementation
}

// In createStringLambdas()
return {
  ...existingLambdas,
  myNewLambda,
};
```

### Type Mapping Issues

If generated code has wrong types, check:
1. `defaultTypeMappings` in the generator metadata
2. Schema transformation in `src/parser/schema-transformer.ts`

## Example: Porting a New Generator

Let's say you want to port the Go generator:

1. **Read the Java code**:
   ```
   modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/GoClientCodegen.java
   modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/AbstractGoCodegen.java
   ```

2. **List templates**:
   ```bash
   ls modules/openapi-generator/src/main/resources/go/
   ```

3. **Create `src/generators/go.ts`** with extracted:
   - Reserved words (Go keywords)
   - Type mappings (`integer` -> `int32`, etc.)
   - Supporting files

4. **Register in `src/generators/index.ts`**

5. **Build and test**:
   ```bash
   npm run build
   node dist/cli/index.js generate -i petstore.yaml -g go -o output/
   ```

## Reference Files

| Java File | Purpose |
|-----------|---------|
| `DefaultCodegen.java` | Base class with common logic |
| `DefaultGenerator.java` | Orchestrates code generation |
| `CodegenModel.java` | Model data structure |
| `CodegenOperation.java` | Operation data structure |
| `CodegenProperty.java` | Property data structure |
| `CodegenParameter.java` | Parameter data structure |
