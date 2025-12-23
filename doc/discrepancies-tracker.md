# Discrepancy Tracker

**Status:** In Progress  
**Date:** December 23, 2025  
**Upstream Version:** OpenAPI Generator v7.18.0

## Summary

All 4 generators show differences when compared to the original Java OpenAPI Generator output. Below is a categorized list of issues to fix.

---

## Generator: typescript-fetch

**Status:** 🔴 2 files differ, 31 diff lines

### Issues Found

#### 1. Missing API Files

- **Issue:** Original generates `PetsApi.ts`, port generates nothing for APIs
- **Category:** Generator Configuration
- **Location:** `src/generators/typescript-fetch.ts`, `src/core/generator.ts`
- **Fix:** Ensure API files are being generated from operations
- **Priority:** HIGH

#### 2. Missing Model Files

- **Issue:** Original generates `ModelError.ts` and `Pet.ts`, port doesn't generate individual model files
- **Category:** Generator Configuration
- **Location:** `src/generators/typescript-fetch.ts`, `src/core/generator.ts`
- **Fix:** Ensure model files are being generated from schemas
- **Priority:** HIGH

#### 3. Missing Documentation Files

- **Issue:** Original generates `docs/` directory with API and model documentation
- **Category:** Template/Generator Config
- **Location:** Supporting files configuration
- **Fix:** Add doc templates to supporting files
- **Priority:** LOW

#### 4. Export Order Different in models/index.ts

- **Issue:** Exports are in different order (Pet before ModelError vs ModelError before Pet)
- **Category:** Acceptable (unless deterministic order required)
- **Location:** Sort order in template data
- **Fix:** Sort model exports alphabetically
- **Priority:** LOW

#### 5. Missing runtime.ts Header Comments

- **Issue:** Header in runtime.ts missing API description and version info
- **Category:** Template Data
- **Location:** `src/core/generator.ts` - OpenAPI info not passed to templates
- **Fix:** Pass `apiDescription` and `apiVersion` from OpenAPI spec to template context
- **Priority:** MEDIUM

#### 6. Extra Files Generated

- **Issue:** Port generates `README.md`, `package.json`, `tsconfig.json` that original doesn't
- **Category:** Generator Configuration
- **Location:** Supporting files list in `src/generators/typescript-fetch.ts`
- **Fix:** Verify which supporting files should be generated
- **Priority:** LOW (may be intentional improvement)

---

## Generator: python

**Status:** 🔴 3 files differ, 210 diff lines

### Issues Found

#### 1. Missing API/Model Source Files

- **Issue:** Original generates `openapi_client/api/pets_api.py` and model files, port generates in different structure
- **Category:** Generator Configuration
- **Location:** `src/generators/python.ts`, output directory structure
- **Fix:** Check package name and directory structure configuration
- **Priority:** HIGH

#### 2. README.md Content Incomplete

- **Issue:** Multiple placeholder values:
  - Package name shows as empty string
  - Version shows as empty string
  - Examples show "false" instead of actual code
  - API table shows "\*\*" instead of class names
  - Repository URL incomplete
- **Category:** Template Data
- **Location:** `src/core/generator.ts` - metadata not being passed correctly
- **Fix:**
  - Pass `packageName`, `packageVersion` to template context
  - Fix conditionals in README template
  - Ensure API operation data available in template
- **Priority:** HIGH

#### 3. pyproject.toml Missing Metadata

- **Issue:**
  - Package name: `petstore_client` vs `openapi_client`
  - Version: empty vs `1.0.0`
  - License: empty vs `MIT`
  - Repository URL incomplete
- **Category:** Template Data / Generator Config
- **Location:** `src/generators/python.ts` - additional properties
- **Fix:** Set default values for `packageVersion`, `licenseName`, `gitHost`, etc.
- **Priority:** HIGH

#### 4. Missing Supporting Files

- **Issue:** Original generates `.github/`, `.travis.yml`, `.gitlab-ci.yml`, `git_push.sh`, `docs/`
- **Category:** Generator Configuration
- **Location:** Supporting files list
- **Fix:** Add missing supporting files to generator configuration
- **Priority:** MEDIUM

---

## Generator: go

**Status:** 🔴 7 files differ, 277 diff lines

### Issues Found

#### 1. Package Name Inconsistent

- **Issue:** Port uses `petstore`, original uses `openapi`
- **Category:** Generator Configuration
- **Location:** `src/generators/go.ts` - package name derivation
- **Fix:** Check how `packageName` is set from generator config
- **Priority:** MEDIUM

#### 2. README.md Missing Content

- **Issue:**
  - API description missing
  - Package version empty
  - Generator version empty
  - Build package shows "go" vs "org.openapitools.codegen.languages.GoClientCodegen"
  - Import path incomplete (`//` vs `github.com/USER/REPO`)
  - API table incomplete ("\*\*" instead of class names)
  - Author shows "false"
- **Category:** Template Data
- **Location:** Template context missing metadata
- **Fix:** Pass OpenAPI spec metadata to templates
- **Priority:** HIGH

#### 3. Missing API File

- **Issue:** Original generates `api_pets.go`, port generates nothing or different structure
- **Category:** Generator Configuration / Template
- **Location:** API file generation logic
- **Fix:** Ensure API operations are being processed and files generated
- **Priority:** HIGH

#### 4. API Service Name Case Difference

- **Issue:** `PetsAPI` vs `PetsApi` in client.go
- **Category:** Name Processing
- **Location:** API class name generation
- **Fix:** Check case conversion for API service names
- **Priority:** MEDIUM

#### 5. client.go Header Comments Missing

- **Issue:** API description and version missing from header
- **Category:** Template Data
- **Location:** Template context
- **Fix:** Pass API metadata to templates
- **Priority:** LOW

---

## Generator: php

**Status:** 🔴 4 files differ, 192 diff lines

### Issues Found

_(Analysis needed - run detailed diff review)_

```bash
cat tmp/comparison-reports/php.diff
```

---

## Common Issues Across All Generators

### 1. ❌ OpenAPI Metadata Not Passed to Templates

- **Affects:** All generators
- **Symptoms:** Missing descriptions, versions, empty placeholders
- **Location:** `src/core/generator.ts` - template context building
- **Fix:** Extract and pass OpenAPI `info` section to all templates:
  - `apiDescription`
  - `apiVersion`
  - `appName`
  - `appDescription`
  - Contact, license, etc.

### 2. ❌ Generator Metadata Not Available

- **Affects:** All generators (README files)
- **Symptoms:** Empty generator version, build package incorrect
- **Location:** `src/core/generator.ts`
- **Fix:** Pass generator name, version, and metadata

### 3. ❌ API/Model Files Not Being Generated

- **Affects:** typescript-fetch, go, possibly python
- **Symptoms:** Missing core API and model source files
- **Location:** `src/core/generator.ts` - file generation loops
- **Fix:** Debug template processing for:
  - Operations → API files
  - Schemas → Model files
  - Ensure templates are being called with correct data

### 4. ❌ Package Configuration Incomplete

- **Affects:** All generators
- **Symptoms:** Empty package names, versions, repository URLs
- **Location:** `src/generators/{language}.ts` - `getAdditionalProperties()`
- **Fix:** Set proper defaults and derive from:
  - Command-line options (`-p` package name)
  - OpenAPI spec
  - Generator defaults

### 5. ⚠️ Supporting Files Missing

- **Affects:** All generators
- **Symptoms:** Missing docs/, CI configs, git helpers
- **Location:** Generator `createMetadata()` - supporting files list
- **Fix:** Review and add missing supporting file templates

---

## Fix Priority

### 🔴 Critical (Breaking - No Output)

1. **API files not generated** (typescript-fetch, go)
2. **Model files not generated** (typescript-fetch)
3. **Package metadata missing** (all generators)

### 🟡 High (Output Broken/Incomplete)

1. **OpenAPI info not passed to templates** (all generators)
2. **README templates with empty data** (python, go)
3. **Package configuration incomplete** (python, go, php)

### 🟢 Medium (Output Works But Differs)

1. **Supporting files missing** (docs, CI configs)
2. **Case differences in names** (PetsAPI vs PetsApi)
3. **Package name defaults** (openapi vs spec-derived)

### ⚪ Low (Cosmetic/Acceptable)

1. **Export ordering** (models/index.ts)
2. **Extra files generated** (may be improvements)
3. **Header comment details**

---

## Debugging Steps

### Step 1: Verify Template Data Is Being Passed

Add debug logging to `src/core/generator.ts`:

```typescript
// In generateFromTemplates or similar
console.error("DEBUG Template Context:", {
  apiName: context.apiName,
  apiDescription: context.apiDescription,
  models: context.models?.length,
  apis: context.apis?.length,
  operations: context.operations?.length,
});
```

### Step 2: Check Operations Are Being Parsed

Add debug logging in `src/parser/operation-transformer.ts`:

```typescript
console.error(
  "DEBUG Operations:",
  operations.map((op) => op.operationId),
);
```

### Step 3: Verify Templates Are Being Found

Add logging when templates are processed:

```typescript
console.error(
  "DEBUG Processing template:",
  templateFile,
  "with context keys:",
  Object.keys(context),
);
```

### Step 4: Check Generator Configuration

Review each generator's `createMetadata()` and `getAdditionalProperties()`:

```bash
grep -A 20 "createMetadata" src/generators/typescript-fetch.ts
```

---

## Test Cases to Add

1. **Metadata Extraction Test**

   ```typescript
   // Ensure OpenAPI info is extracted
   test("extracts API metadata from OpenAPI spec", () => {
     const spec = { info: { title: "Test API", version: "1.0" } };
     const context = buildContext(spec);
     expect(context.apiDescription).toBe("Test API");
     expect(context.apiVersion).toBe("1.0");
   });
   ```

2. **Operation Processing Test**

   ```typescript
   // Ensure operations generate API files
   test('generates API files for operations', () => {
     const spec = { paths: { '/pets': { get: {...} } } };
     const files = generate(spec, 'typescript-fetch');
     expect(files).toContain('apis/PetsApi.ts');
   });
   ```

3. **Model Processing Test**
   ```typescript
   // Ensure schemas generate model files
   test('generates model files for schemas', () => {
     const spec = { components: { schemas: { Pet: {...} } } };
     const files = generate(spec, 'typescript-fetch');
     expect(files).toContain('models/Pet.ts');
   });
   ```

---

## Next Actions

1. ✅ Templates synced from upstream v7.18.0
2. ✅ Comparison complete - 4/4 generators show differences
3. 🔄 **CURRENT: Analyze root causes**
4. ⏳ Implement fixes for critical issues
5. ⏳ Re-run comparison after each fix
6. ⏳ Update tests to prevent regressions

---

## Notes

- All generators are reading templates correctly (sync worked)
- Core issue appears to be in **data preparation** and **file generation loops**
- Template conversion seems OK (no Handlebars syntax errors)
- Focus on `src/core/generator.ts` and individual generator configs first
