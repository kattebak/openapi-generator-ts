# Generator Debugging Guide

Quick reference for fixing generator output discrepancies.

## Generator Status

| Generator | Models | APIs | Status |
|-----------|--------|------|--------|
| typescript-fetch | ✅ | ✅ | Done (cosmetic diffs only) |
| go | ✅ | ❌ | API files need work |
| python | ❌ | ❌ | TODO |
| php | ❌ | ❌ | TODO |

## Common Issues & Fixes

### 1. Wrong Field/Variable Names

**Symptom:** `id` instead of `Id`, `create_pets` instead of `CreatePets`

**Cause:** Missing language-specific naming hook

**Fix:** Add `toVarName` hook to generator metadata

```typescript
// src/generators/{lang}.ts
function toLangVarName(name: string): string {
  return pascalCase(name); // or camelCase, snake_case, etc.
}

// In createMetadata()
toVarName: toLangVarName,
```

### 2. Missing Type Mappings

**Symptom:** `integer` instead of `int32`, wrong nullable types

**Fix:** Add to `LANG_TYPE_MAPPINGS` in generator file

```typescript
const LANG_TYPE_MAPPINGS: Record<string, string> = {
  integer: "int32",
  int64: "int64",
  // ...
};
```

### 3. Missing Vendor Extensions

**Symptom:** Missing language-specific metadata (JSON tags, decorators, annotations)

**Fix:** Add `postProcessProperty` or `postProcessModel` hook

```typescript
function postProcessLangProperty(property: CodegenProperty): void {
  property.vendorExtensions["x-lang-specific"] = computeValue(property);
}
```

### 4. Wrong File Structure

**Symptom:** Files in wrong directories, wrong filenames

**Fix:** Set these in metadata:
- `defaultApiPackage` / `defaultModelPackage` - subdirectory
- `toModelFilename` / `toApiFilename` - filename hooks

### 5. Template Syntax Not Rendering

**Symptom:** Raw template code in output like `<%#var%>`

**Cause:** Unconverted Mustache syntax

**Fix:** Update `src/cli/convert-template.ts` to handle the pattern

### 6. Missing Imports

**Symptom:** Required imports not in output

**Fix:** Add to `model.imports` Set in `postProcessModel`

```typescript
model.imports.add("required_package");
```

## Debugging Decision Tree

```
Output differs from original?
│
├─ Wrong names/casing?
│  └─ Add toVarName/toApiClassName/toOperationId hook
│
├─ Wrong types?
│  └─ Add to TYPE_MAPPINGS in generator
│
├─ Missing metadata (tags, decorators)?
│  └─ Add postProcessProperty/postProcessModel hook
│
├─ Wrong file location/name?
│  └─ Set defaultPackage or toFilename hooks
│
├─ Raw template syntax in output?
│  └─ Fix src/cli/convert-template.ts
│
├─ Missing imports?
│  └─ Add to model.imports in postProcessModel
│
└─ Structural difference?
   └─ Check template vs Java template, may need template fix
```

## Debugging Commands

### Generate & Compare

```bash
# Generate original output
npx @openapitools/openapi-generator-cli generate \
  -i samples/petstore.yaml -g GENERATOR -o tmp/original-GENERATOR

# Generate our output
rm -rf samples/build/GENERATOR
npx tsx src/cli/index.ts generate \
  -i samples/petstore.yaml -g GENERATOR -o samples/build/GENERATOR

# Compare single file
diff tmp/original-GENERATOR/FILE samples/build/GENERATOR/FILE

# Compare all files
diff -r tmp/original-GENERATOR samples/build/GENERATOR | head -100
```

### Inspect Template Data

```bash
# Add debug logging to generator.ts before render call
console.error("TEMPLATE DATA:", JSON.stringify(templateData, null, 2));
```

### Check Template Conversion

```bash
# Compare original vs converted template
diff /path/to/openapi-generator/modules/.../templates/TEMPLATE \
     templates/GENERATOR/TEMPLATE
```

### Search Codebase

```bash
# Find where a property is set
grep -rn "propertyName" src/

# Find template usage
grep -rn "{{propertyName}}" templates/GENERATOR/
```

## Adding a New Hook

1. Add to `GeneratorMetadata` interface in `src/core/config.ts`
2. Call the hook in appropriate place in `src/core/generator.ts` or transformer
3. Implement in `src/generators/{lang}.ts`
4. Add to metadata return object

## Unit Test Checklist

When fixing an issue, add a test for:

- [ ] The specific transformation (e.g., `toVarName("pet_id")` → `"PetId"`)
- [ ] The hook is called during generation
- [ ] Edge cases (empty string, reserved words, special characters)

