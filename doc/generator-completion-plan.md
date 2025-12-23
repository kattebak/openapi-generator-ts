# Generator Completion Plan

Simple step-by-step plan for completing all generators.

## Phase 1: Complete Remaining Generators

### For Each Generator (python, php, go-apis)

1. **Generate reference output**
   ```bash
   npx @openapitools/openapi-generator-cli generate \
     -i samples/petstore.yaml -g GENERATOR -o tmp/original-GENERATOR
   ```

2. **Generate our output**
   ```bash
   npx tsx src/cli/index.ts generate \
     -i samples/petstore.yaml -g GENERATOR -o samples/build/GENERATOR
   ```

3. **Compare and list differences**
   ```bash
   diff -r tmp/original-GENERATOR samples/build/GENERATOR > tmp/GENERATOR-diff.txt
   ```

4. **Fix each difference** (use decision tree in debugging guide)

5. **Add unit test for the fix**

6. **Re-compare until diff is cosmetic only**

### Priority Order

1. `go` - Finish API files
2. `python` - Full review
3. `php` - Full review

## Phase 2: Add Unit Tests for Fixes

### Go Generator Tests

Add to `src/generators/generators.test.ts`:

```typescript
describe("Go Generator", () => {
  test("toGoVarName converts to PascalCase", () => {
    assert.strictEqual(toGoVarName("pet_id"), "PetId");
    assert.strictEqual(toGoVarName("id"), "Id");
  });

  test("toGoVarName handles reserved words", () => {
    assert.strictEqual(toGoVarName("type"), "Type_");
    assert.strictEqual(toGoVarName("func"), "Func_");
  });

  test("postProcessGoProperty sets vendor extensions", () => {
    const prop = createCodegenProperty({ baseName: "id", required: true });
    postProcessGoProperty(prop);
    assert.strictEqual(prop.vendorExtensions["x-go-datatag"], ' `json:"id"`');
  });

  test("postProcessGoModel adds imports", () => {
    const model = createCodegenModel({ name: "Pet" });
    postProcessGoModel(model);
    assert.ok(model.imports.has("bytes"));
    assert.ok(model.imports.has("fmt"));
  });
});
```

### Tests to Add for Each Fix

| Fix | Test |
|-----|------|
| `toVarName` | Input/output pairs for naming |
| `postProcessProperty` | Vendor extensions are set |
| `postProcessModel` | Imports added, extensions set |
| Type mappings | Each type maps correctly |
| Reserved words | Suffixed/escaped correctly |

## Phase 3: Code Review & DRY

After all generators pass:

1. **Review hooks across generators**
   - Find duplicate logic in `toVarName`, `postProcess*` functions
   - Extract common helpers to `src/utils/`

2. **Generalize naming utilities**
   ```typescript
   // src/utils/naming.ts
   export function toPascalCase(s: string): string { ... }
   export function toSnakeCase(s: string): string { ... }
   export function escapeReservedWord(word: string, suffix: string): string { ... }
   ```

3. **Review generator.ts**
   - Look for repeated patterns in template data creation
   - Consider extracting model/operation formatting

4. **Re-run all comparisons**
   ```bash
   for gen in typescript-fetch go python php; do
     rm -rf samples/build/$gen
     npx tsx src/cli/index.ts generate -i samples/petstore.yaml -g $gen -o samples/build/$gen
     diff -rq tmp/original-$gen samples/build/$gen
   done
   ```

## Phase 4: Final Validation

1. Run full test suite: `npm test`
2. Compare all generators one final time
3. Document any intentional differences
4. Update README with generator status

## Quick Reference

### Files to Modify Per Generator

| Purpose | File |
|---------|------|
| Generator config | `src/generators/{lang}.ts` |
| Hook interfaces | `src/core/config.ts` |
| Hook calls | `src/core/generator.ts` |
| Template conversion | `src/cli/convert-template.ts` |
| Unit tests | `src/generators/generators.test.ts` |

### Debugging Checklist

- [ ] Generated reference output from original
- [ ] Ran diff to identify all discrepancies
- [ ] Categorized each diff (naming, types, structure, template)
- [ ] Applied fix using appropriate hook
- [ ] Added unit test for fix
- [ ] Re-ran diff to confirm fix
- [ ] No regressions in other generators

