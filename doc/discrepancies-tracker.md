# Discrepancy Tracker

**Status:** In Progress
**Date:** December 23, 2025
**Upstream Version:** OpenAPI Generator v7.18.0

## Summary

All 4 generators show differences when compared to the original Java OpenAPI Generator output. Below is a categorized list of issues to fix.

---

## Generator: go

**Status:** 🔴 12 files differ, 506 diff lines

### Issues Found

#### 1. Incorrect Return Values in Error Handling
- **Issue:** `api_pets.go` returns 2 values (`return localVarHTTPResponse, newErr`) instead of 3 (`return localVarReturnValue, localVarHTTPResponse, newErr`) in error cases.
- **Category:** Code Generation Bug
- **Location:** `src/generators/go.ts` or templates
- **Fix:** Ensure correct number of return values in API methods.
- **Priority:** CRITICAL

#### 2. README Documentation Broken
- **Issue:**
  - Missing generator version.
  - Broken links to API and Model docs (`[**ListPets**](.md#)`).
  - Incorrect import path (`import petstore "//"`).
- **Category:** Template Data
- **Location:** `src/core/generator.ts` or `src/generators/go.ts`
- **Fix:** Pass correct context variables (`apiDocPath`, `modelDocPath`, `gitUserId`, `gitRepoId`, `generatorVersion`).
- **Priority:** HIGH

#### 3. Whitespace and Formatting
- **Issue:** Minor whitespace differences in generated code (e.g., `[]string{ "application/json" }`).
- **Category:** Cosmetic
- **Priority:** LOW

---

## Generator: typescript-fetch

**Status:** 🔴 5 files differ, 137 diff lines

### Issues Found

#### 1. README Broken
- **Issue:** Missing package name (`# @` instead of `# petstore-client`).
- **Category:** Template Data
- **Location:** `src/generators/typescript-fetch.ts`
- **Fix:** Ensure `npmName` or `packageName` is passed to template context.
- **Priority:** MEDIUM

#### 2. Missing Ignore Files
- **Issue:** `.gitignore` and `.npmignore` missing in port output.
- **Category:** Generator Configuration
- **Location:** `src/generators/typescript-fetch.ts` (supporting files)
- **Fix:** Add missing supporting files.
- **Priority:** LOW

---

## Generator: python

**Status:** 🔴 5 files differ, 218 diff lines

### Issues Found

#### 1. File Naming Convention Mismatch
- **Issue:** Port generates `Error.py`, `Pet.py` (PascalCase) instead of `models/error.py`, `models/pet.py` (snake_case).
- **Category:** Generator Configuration
- **Location:** `src/generators/python.ts`
- **Fix:** Implement snake_case conversion for filenames.
- **Priority:** HIGH

#### 2. README Broken
- **Issue:** Missing package name, version, python version.
- **Category:** Template Data
- **Fix:** Pass correct metadata to templates.
- **Priority:** MEDIUM

#### 3. Missing CI Files
- **Issue:** `.github`, `.gitlab-ci.yml`, `.travis.yml` missing.
- **Category:** Generator Configuration
- **Fix:** Add supporting files.
- **Priority:** LOW

---

## Generator: php

**Status:** 🔴 4 files differ, 166 diff lines

### Issues Found

#### 1. File Naming/Location Mismatch
- **Issue:** Port generates `Error.php`, `Pet.php` in root/lib instead of `lib/Model/Error.php`.
- **Category:** Generator Configuration
- **Location:** `src/generators/php.ts`
- **Fix:** Ensure correct directory structure for models and APIs.
- **Priority:** HIGH

#### 2. README Broken
- **Issue:** Unreplaced variables (`{{classname}}`).
- **Category:** Template Data
- **Fix:** Fix template context.
- **Priority:** MEDIUM
