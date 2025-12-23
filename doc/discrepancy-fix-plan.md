# Discrepancy Fix Plan: OpenAPI Generator TypeScript Port vs Original

**Goal:** Ensure this TypeScript port generates identical or semantically equivalent output to the original OpenAPI Generator Java project.

**Date:** December 23, 2025

## Overview

This plan outlines the systematic approach to identify and fix discrepancies between the TypeScript port and the original Java OpenAPI Generator project. We'll start with a clean template baseline, then compare generated outputs to identify and fix differences.

## Phase 1: Template Synchronization (Clean Slate)

### 1.1 Pre-Sync Preparation

- [ ] **Backup current templates** (optional, but recommended)

  ```bash
  cp -r templates templates.backup
  ```

- [ ] **Check current Git status**

  ```bash
  git status
  git add -A
  git commit -m "Pre-template-sync snapshot"
  ```

- [ ] **Verify sync script is up to date**
  - Review `scripts/sync-templates.sh`
  - Ensure all generators in scope are listed in `GENERATOR_CONFIGS`
  - Current generators: `typescript-fetch`, `python`, `go`, `php`

### 1.2 Template Sync Execution

- [ ] **Run clean template sync for all generators**

  ```bash
  npm run sync-templates:clean
  ```

  This will:
  - Clone/update the original OpenAPI Generator repository
  - Copy latest templates from Java project
  - Convert Mustache syntax to Handlebars-compatible format
  - Apply automatic transformations (delimiter changes, lambda syntax)

- [ ] **Review sync results**
  - Check console output for warnings/errors
  - Verify file counts match expectations
  - Note any templates that failed conversion

- [ ] **Commit synced templates**
  ```bash
  git add templates/
  git commit -m "Sync templates from upstream OpenAPI Generator"
  ```

### 1.3 Template Validation

- [ ] **Inspect converted templates for known issues**
  - String conditionals: Verify `{{#if var}}` not `{{#var}}` for strings
  - Lambda syntax: Check `{{#func}}` not `{{#lambda.func}}`
  - Delimiter changes: Ensure no `{{=<% %>=}}` remain
  - Nested context: Look for proper `{{../var}}` usage

- [ ] **Run template conversion tests**
  ```bash
  npm run test:unit -- --grep "convert-template"
  ```

## Phase 2: Output Comparison Setup

### 2.1 Generate Reference Output (Original Java Project)

For each generator, generate output using the original OpenAPI Generator:

- [ ] **Install official OpenAPI Generator CLI**

  ```bash
  npm install -g @openapitools/openapi-generator-cli
  ```

- [ ] **Generate reference outputs**

  ```bash
  # Create output directory
  mkdir -p tmp/original-output

  # TypeScript Fetch
  npx @openapitools/openapi-generator-cli generate \
    -i samples/petstore.yaml \
    -g typescript-fetch \
    -o tmp/original-output/typescript-fetch

  # Python
  npx @openapitools/openapi-generator-cli generate \
    -i samples/petstore.yaml \
    -g python \
    -o tmp/original-output/python

  # Go
  npx @openapitools/openapi-generator-cli generate \
    -i samples/petstore.yaml \
    -g go \
    -o tmp/original-output/go

  # PHP
  npx @openapitools/openapi-generator-cli generate \
    -i samples/petstore.yaml \
    -g php \
    -o tmp/original-output/php
  ```

### 2.2 Generate TypeScript Port Output

- [ ] **Clean previous builds**

  ```bash
  cd samples && make clean
  ```

- [ ] **Build TypeScript port**

  ```bash
  npm run build
  ```

- [ ] **Generate outputs with TypeScript port**
  ```bash
  cd samples && make all
  ```
  This generates to `samples/build/{generator}/`

### 2.3 Compare Outputs

- [ ] **Create comparison script** (automated diff analysis)
      Create `scripts/compare-outputs.sh`:

  ```bash
  #!/usr/bin/env bash
  # Compare original vs TS port outputs for each generator

  GENERATORS="typescript-fetch python go php"
  ORIGINAL_DIR="tmp/original-output"
  PORT_DIR="samples/build"
  REPORT_DIR="tmp/comparison-reports"

  mkdir -p "$REPORT_DIR"

  for gen in $GENERATORS; do
    echo "Comparing $gen..."
    diff -r -u \
      "$ORIGINAL_DIR/$gen" \
      "$PORT_DIR/$gen" \
      > "$REPORT_DIR/$gen.diff" 2>&1 || true

    # Count differences
    if [ -s "$REPORT_DIR/$gen.diff" ]; then
      lines=$(wc -l < "$REPORT_DIR/$gen.diff")
      echo "  Found $lines diff lines"
    else
      echo "  No differences!"
    fi
  done
  ```

- [ ] **Run comparison**

  ```bash
  chmod +x scripts/compare-outputs.sh
  ./scripts/compare-outputs.sh
  ```

- [ ] **Review diff reports**
  ```bash
  ls -lh tmp/comparison-reports/
  less tmp/comparison-reports/typescript-fetch.diff
  ```

## Phase 3: Discrepancy Analysis & Categorization

### 3.1 Categorize Differences

Review each diff report and categorize issues into:

#### A. **Acceptable Differences**

- Comments/headers with different timestamps or versions
- Whitespace-only differences
- Different ordering of elements that doesn't affect functionality
- Language-specific idioms that are equivalent but syntactically different

#### B. **Template Issues**

- Missing template files
- Incorrect template variable interpolation
- Handlebars vs Mustache conversion errors
- Missing or incorrect conditionals
- Incorrect loop structures

#### C. **Generator Configuration Issues**

- Missing or incorrect type mappings
- Missing import mappings
- Incorrect reserved words
- Wrong default values
- Missing supporting files

#### D. **Parser/Transformer Issues**

- Incorrect OpenAPI spec parsing
- Wrong schema resolution
- Incorrect operation grouping
- Missing or incorrect parameter/property transformations
- $ref resolution errors

#### E. **Template Data (Context) Issues**

- Missing variables in template context
- Incorrect variable values
- Wrong data structure passed to templates
- Missing helper/lambda functions

### 3.2 Create Issue Tracking Document

- [ ] **Document findings in organized format**
      Create `doc/discrepancies-tracker.md` with structure:

  ```markdown
  # Discrepancies Tracker

  ## Generator: typescript-fetch

  ### Template Issues

  - [ ] File: api.mustache, Line 45 - Missing import statement
  - [ ] File: model.mustache - Incorrect conditional for optional properties

  ### Generator Config Issues

  - [ ] Missing type mapping for `integer` format `int64`

  ### Parser Issues

  - [ ] Operation IDs not being correctly camelCased

  ## Generator: python

  ...
  ```

## Phase 4: Fix Implementation

### 4.1 Priority Order

Fix issues in this order:

1. **Parser/Transformer** - Foundation for correct data
2. **Generator Configuration** - Core mappings and settings
3. **Template Data/Context** - Ensure correct data is passed
4. **Templates** - Final rendering layer

### 4.2 Fix Workflow (Per Issue)

For each identified issue:

1. **Create targeted test case**
   - Add to existing test file or create new one
   - Test should fail with current implementation
   - Example: `src/generators/typescript-fetch.test.ts`

2. **Implement fix**
   - Make minimal, targeted changes
   - Follow existing code patterns
   - Add inline comments for complex logic

3. **Verify fix**

   ```bash
   npm run test:unit          # Unit tests pass
   npm run build              # Compiles successfully
   cd samples && make clean typescript-fetch  # Regenerate
   ./scripts/compare-outputs.sh  # Verify fix
   ```

4. **Commit fix**
   ```bash
   git add -p
   git commit -m "fix(typescript-fetch): correct type mapping for int64"
   ```

### 4.3 Common Fix Locations

Based on AGENTS.md common issues table:

| Issue Type              | Primary Fix Location                  | Secondary Locations                   |
| ----------------------- | ------------------------------------- | ------------------------------------- |
| Empty names             | `src/core/generator.ts`               | `src/parser/operation-transformer.ts` |
| Wrong types             | `src/parser/operation-transformer.ts` | `src/generators/{language}.ts`        |
| Missing imports         | `templates/{generator}/`              | `src/generators/{language}.ts`        |
| Undefined template vars | `templates/{generator}/`              | `src/core/generator.ts`               |
| Schema resolution       | `src/parser/schema-transformer.ts`    | `src/parser/openapi-parser.ts`        |
| Reserved words          | `src/generators/{language}.ts`        | -                                     |

## Phase 5: Iterative Refinement

### 5.1 Iteration Cycle

Repeat until all differences are resolved or documented as acceptable:

1. **Re-sync templates** (if upstream changes)

   ```bash
   npm run sync-templates
   ```

2. **Implement fixes** (from tracker)

3. **Regenerate & compare**

   ```bash
   npm run build
   cd samples && make clean all
   ./scripts/compare-outputs.sh
   ```

4. **Update tracker** (mark completed, add new findings)

5. **Review remaining diffs**

### 5.2 Validation Checkpoints

After each major fix batch:

- [ ] **Run full test suite**

  ```bash
  npm test
  ```

- [ ] **Check for regressions**
  - Review git diff of generated samples
  - Ensure fixes didn't break other generators

- [ ] **Update documentation**
  - Update AGENTS.md if new patterns discovered
  - Update porting-guide.md with lessons learned

## Phase 6: Final Validation

### 6.1 Comprehensive Testing

- [ ] **Test with multiple OpenAPI specs**
  - Petstore (simple)
  - Complex spec with nested schemas
  - Spec with various parameter types
  - Spec with security schemes

- [ ] **Verify generated code compiles/runs**
  - TypeScript: `tsc --noEmit` in generated directory
  - Python: `python -m py_compile` on generated files
  - Go: `go build` in generated directory
  - PHP: `php -l` on generated files

- [ ] **Run generated client tests** (if available)

### 6.2 Documentation

- [ ] **Update README.md** with current status
- [ ] **Update generators.md** with known limitations
- [ ] **Create CHANGELOG entry** summarizing fixes

### 6.3 Final Comparison

- [ ] **Generate fresh comparison** with latest upstream
- [ ] **Document remaining acceptable differences**
- [ ] **Calculate similarity metrics** (% of identical files)

## Appendix

### A. Useful Commands

```bash
# Quick diff for single generator
diff -r --brief tmp/original-output/typescript-fetch samples/build/typescript-fetch

# Count differing files
diff -r --brief tmp/original-output/typescript-fetch samples/build/typescript-fetch | wc -l

# Show only file names that differ
diff -qr tmp/original-output/typescript-fetch samples/build/typescript-fetch | grep differ

# Compare specific file
diff -u tmp/original-output/typescript-fetch/apis/PetApi.ts \
        samples/build/typescript-fetch/apis/PetApi.ts

# Ignore whitespace differences
diff -wbBr tmp/original-output/typescript-fetch samples/build/typescript-fetch
```

### B. Template Conversion Reference

Common manual fixes needed after auto-conversion:

```handlebars
# Before (Mustache):
{{#returnType}}return {{.}}{{/returnType}}

# After (Handlebars) - for string values:
{{#if returnType}}return {{returnType}}{{/if}}

# Before (Mustache):
{{#lambda.indented}}...{{/lambda.indented}}

# After (Handlebars):
{{#indented}}...{{/indented}}

# Parent context access:
{{#each operations}}
  Class: {{../classname}}
{{/each}}
```

### C. Generator Configuration Checklist

When comparing generators, verify:

- [ ] Reserved words list
- [ ] Type mappings (primitives → language types)
- [ ] Import mappings (OpenAPI types → language imports)
- [ ] Supporting files (configuration, base classes, utilities)
- [ ] Template files (all expected templates present)
- [ ] Additional properties (generator-specific settings)
- [ ] Language features (nullable handling, enums, etc.)

### D. Debugging Tips

**Template variable debugging:**

```handlebars
<!-- Add to template temporarily -->
<!-- DEBUG: classname={{classname}} -->
<!-- DEBUG: operations={{json operations}} -->
{{#each operations}}
  <!-- DEBUG: operation={{json .}} -->
{{/each}}
```

**Generator debugging:**

```typescript
// In src/core/generator.ts or generator file
console.error("DEBUG operation:", JSON.stringify(operation, null, 2));
```

**Diff analysis:**

```bash
# Show only additions
diff -u original port | grep '^+'

# Show only deletions
diff -u original port | grep '^-'

# Context around specific pattern
diff -u original port | grep -A5 -B5 'pattern'
```

## Success Criteria

The project will be considered aligned with upstream when:

1. ✅ Templates are synchronized from latest upstream
2. ✅ Generated output matches original for all test cases
3. ✅ All acceptable differences are documented
4. ✅ No regressions in existing functionality
5. ✅ Test suite passes (including generated code compilation)
6. ✅ Documentation is updated with current status

## Notes

- Keep original diff reports for reference
- Document any upstream bugs discovered
- Consider contributing fixes back to upstream project
- Track upstream versions used for comparison

---

## Go Generator: Remaining Fixes

**Status:** Model files are ~99% identical. API files need work.

### Completed ✅

| Issue                        | Fix Applied                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| Package name empty           | Derive from API title (`"Swagger Petstore"` → `petstore`)              |
| Lowercase field names        | Added `toVarName` hook returning PascalCase via `camelize()`           |
| Missing JSON struct tags     | `postProcessProperty` sets `x-go-datatag` vendor extension             |
| No MarshalJSON/UnmarshalJSON | `postProcessModel` sets `x-go-generate-marshal-json` vendor extensions |
| Missing bytes/fmt imports    | `postProcessModel` adds to `model.imports` Set                         |
| Wrong file structure         | Set `defaultApiPackage`/`defaultModelPackage` to `""`                  |
| Wrong filenames              | Added `toModelFilename`/`toApiFilename` hooks                          |
| int32 instead of int64       | Added `int64` format to `GO_TYPE_MAPPINGS`                             |

### Remaining Model Issues (Cosmetic)

1. **Missing blank line after `DO NOT EDIT.`**
   - Location: `templates/go/partial_header.mustache`
   - Fix: Add trailing newline in template converter for Go templates
   - Priority: Low (cosmetic only)

2. **Missing trailing newline at EOF**
   - Location: Various templates
   - Fix: Ensure template engine adds final newline
   - Priority: Low (cosmetic only)

### Remaining API File Issues

#### 1. Operation names not PascalCase

**Problem:** `createPets` instead of `CreatePets` (Go exported functions must be capitalized)

**Location:** `src/parser/operation-transformer.ts` or `src/generators/go.ts`

**Fix approach:**

```typescript
// In go.ts, add toOperationId hook
function toGoOperationId(operationId: string): string {
  return camelize(operationId); // PascalCase
}
```

**Files to modify:**

- `src/core/config.ts` - Add `toOperationId` to GeneratorMetadata
- `src/parser/operation-transformer.ts` - Use hook when setting operationId
- `src/generators/go.ts` - Implement `toGoOperationId`

#### 2. HTTP method constant wrong case

**Problem:** `http.MethodPOST` instead of `http.MethodPost`

**Location:** Template or operation transformer

**Investigation needed:**

```bash
grep -r "MethodPOST\|MethodPost" templates/go/
grep -r "httpMethod" src/parser/
```

**Likely fix:** Operation transformer sets `httpMethod` to uppercase (`POST`), but Go uses `http.MethodPost` (PascalCase).

#### 3. Content types template not rendering

**Problem:** Raw template syntax appearing: `<%#consumes%>""<%^-last%>, <%/-last%><%/consumes%>`

**Location:** `templates/go/api.mustache`

**Cause:** Template uses `<% %>` delimiters which aren't being processed

**Fix approach:**

- Check `src/cli/convert-template.ts` for delimiter handling
- May need to add conversion for this specific pattern

#### 4. Missing `strings` import

**Problem:** API file missing `"strings"` import

**Investigation needed:**

```bash
grep -n "strings" tmp/original-go/api_pets.go
```

**Likely fix:** Need to detect when `strings` package is used and add to imports

### Implementation Priority

1. **High:** Operation names PascalCase (breaks Go compilation)
2. **High:** Content types template syntax (breaks Go compilation)
3. **Medium:** HTTP method case (may cause runtime issues)
4. **Medium:** Missing strings import (breaks if strings functions used)
5. **Low:** Cosmetic whitespace differences

### Testing Commands

```bash
# Regenerate Go output
rm -rf samples/build/go
npx tsx src/cli/index.ts generate -i samples/petstore.yaml -g go -o samples/build/go

# Compare with original
diff tmp/original-go/model_pet.go samples/build/go/model_pet.go
diff tmp/original-go/api_pets.go samples/build/go/api_pets.go

# Try to compile generated Go code
cd samples/build/go && go build ./...
```
