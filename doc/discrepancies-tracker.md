# Discrepancy Tracker

**Status:** Complete
**Date:** December 23, 2025
**Upstream Version:** OpenAPI Generator v7.18.0

## Summary

All major discrepancies across all 4 generators have been fixed. Only cosmetic whitespace differences remain in the Go generator (LOW priority, acceptable to ignore).

---

## Generator: go

**Status:** 🟡 Improved (2 critical issues fixed)

### Issues Found

#### 1. ~~Incorrect Return Values in Error Handling~~ ✅ FIXED
- **Issue:** `api_pets.go` returns 2 values (`return localVarHTTPResponse, newErr`) instead of 3 (`return localVarReturnValue, localVarHTTPResponse, newErr`) in error cases.
- **Category:** Code Generation Bug
- **Location:** `templates/go/api.mustache`
- **Fix:** Changed `{{#if returnType}}` to `{{#if ../../returnType}}` inside `{{#responses}}{{#dataType}}` block to access parent context.
- **Priority:** CRITICAL
- **Status:** ✅ Fixed in templates/go/api.mustache

#### 2. ~~README Documentation Broken~~ ✅ FIXED
- **Issue:**
  - Missing generator version.
  - Broken links to API and Model docs (`[**ListPets**](.md#)`).
  - Incorrect import path (`import petstore "//"`).
- **Category:** Template Data
- **Location:** `src/core/generator.ts` and `src/generators/go.ts`
- **Fix:**
  - Added `generatorVersion` to global template data (reads from package.json)
  - Added `gitHost`, `gitUserId`, `gitRepoId` to Go additional properties
  - Registered additional properties providers for all generators
- **Priority:** HIGH
- **Status:** ✅ Fixed

#### 3. Whitespace and Formatting
- **Issue:** Minor whitespace differences in generated code (e.g., `[]string{ "application/json" }`).
- **Category:** Cosmetic
- **Priority:** LOW

---

## Generator: typescript-fetch

**Status:** 🟢 All Issues Fixed

### Issues Found

#### 1. ~~README Broken~~ ✅ FIXED
- **Issue:** Missing package name (`# @` instead of `# petstore-client`).
- **Category:** Template Data
- **Location:** `src/generators/typescript-fetch.ts`
- **Fix:** Registered `getTypescriptAdditionalProperties` provider in `src/generators/index.ts`
- **Priority:** MEDIUM
- **Status:** ✅ Fixed

#### 2. ~~Missing Ignore Files~~ ✅ FIXED
- **Issue:** `.gitignore` and `.npmignore` missing in port output.
- **Category:** Generator Configuration
- **Location:** `src/generators/typescript-fetch.ts` (supporting files)
- **Fix:** Added `.gitignore` and `.npmignore` to supporting files in generator metadata.
- **Priority:** LOW
- **Status:** ✅ Fixed

---

## Generator: python

**Status:** 🟢 All Issues Fixed

### Issues Found

#### 1. ~~File Naming Convention Mismatch~~ ✅ FIXED
- **Issue:** Port generates `Error.py`, `Pet.py` (PascalCase) instead of `models/error.py`, `models/pet.py` (snake_case).
- **Category:** Generator Configuration
- **Location:** `src/generators/python.ts`
- **Fix:**
  - Added `toPythonModelFilename` function with `snakeCase` conversion
  - Added `defaultModelPackage: "{{packageName}}/models"`
  - Added `interpolatePath` helper in `src/core/generator.ts` to resolve template variables in folder paths
- **Priority:** HIGH
- **Status:** ✅ Fixed

#### 2. ~~README Broken~~ ✅ FIXED
- **Issue:** Missing package name, version, python version.
- **Category:** Template Data
- **Fix:**
  - Registered `getPythonAdditionalProperties` provider in `src/generators/index.ts`
  - Added `generatorLanguageVersion` (defaults to "3.8+")
  - Added `generatorVersion` to global template data
- **Priority:** MEDIUM
- **Status:** ✅ Fixed

#### 3. ~~Missing CI Files~~ ✅ FIXED
- **Issue:** `.github`, `.gitlab-ci.yml`, `.travis.yml` missing.
- **Category:** Generator Configuration
- **Location:** `src/generators/python.ts` (supporting files)
- **Fix:** Added `.travis.yml` and `.gitlab-ci.yml` to supporting files in generator metadata.
- **Priority:** LOW
- **Status:** ✅ Fixed

---

## Generator: php

**Status:** 🟢 All Issues Fixed

### Issues Found

#### 1. ~~File Naming/Location Mismatch~~ ✅ FIXED
- **Issue:** Port generates `Error.php`, `Pet.php` in root/lib instead of `lib/Model/Error.php`.
- **Category:** Generator Configuration
- **Location:** `src/generators/php.ts`
- **Fix:**
  - Added `defaultModelPackage: "{{srcBasePath}}/Model"`
  - Added `defaultApiPackage: "{{srcBasePath}}/Api"`
  - Uses `interpolatePath` helper to resolve `{{srcBasePath}}` (defaults to "lib")
- **Priority:** HIGH
- **Status:** ✅ Fixed

#### 2. ~~README Broken~~ ✅ FIXED
- **Issue:** Unreplaced variables (`{{classname}}`).
- **Category:** Template Data
- **Fix:**
  - Registered `getPhpAdditionalProperties` provider in `src/generators/index.ts`
  - Added `gitHost`, `gitUserId`, `gitRepoId` variables
  - Enhanced `apiInfo` operations with `classname` property in `src/core/generator.ts`
  - Fixed Handlebars escape sequence: `\{{classname}}` → `\\{{classname}}` in `templates/php/README.mustache`
- **Priority:** MEDIUM
- **Status:** ✅ Fixed
