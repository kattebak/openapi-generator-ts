/**
 * CodegenModel tests
 * Tests for the codegen model data structures
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createCodegenModel, type CodegenModel } from './codegen-model.js';

describe('CodegenModel', () => {
  describe('createCodegenModel', () => {
    it('should create a model with default values', () => {
      const model = createCodegenModel('Pet', 'Pet');

      assert.strictEqual(model.name, 'Pet');
      assert.strictEqual(model.classname, 'Pet');
      assert.strictEqual(model.isModel, true);
      assert.strictEqual(model.isEnum, false);
      assert.strictEqual(model.isArray, false);
      assert.strictEqual(model.isMap, false);
      assert.strictEqual(model.isContainer, false);
    });

    it('should create model with custom classname', () => {
      const model = createCodegenModel('pet', 'PetModel');

      assert.strictEqual(model.name, 'pet');
      assert.strictEqual(model.classname, 'PetModel');
    });

    it('should initialize empty arrays for vars', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.ok(Array.isArray(model.vars));
      assert.ok(Array.isArray(model.allVars));
      assert.ok(Array.isArray(model.requiredVars));
      assert.ok(Array.isArray(model.optionalVars));
      assert.ok(Array.isArray(model.readOnlyVars));
      assert.ok(Array.isArray(model.readWriteVars));
      assert.strictEqual(model.vars.length, 0);
    });

    it('should initialize empty imports Set', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.ok(model.imports instanceof Set);
      assert.strictEqual(model.imports.size, 0);
    });

    it('should initialize empty vendorExtensions object', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.ok(typeof model.vendorExtensions === 'object');
      assert.strictEqual(Object.keys(model.vendorExtensions).length, 0);
    });

    it('should set hasVars flags to false', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.strictEqual(model.hasVars, false);
      assert.strictEqual(model.hasEnums, false);
      assert.strictEqual(model.hasRequired, false);
      assert.strictEqual(model.hasOptional, false);
      assert.strictEqual(model.hasReadOnly, false);
      assert.strictEqual(model.hasOnlyReadOnly, false);
    });

    it('should set type flags correctly for regular model', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.strictEqual(model.isNull, false);
      assert.strictEqual(model.isVoid, false);
      assert.strictEqual(model.isAnyType, false);
      assert.strictEqual(model.isPrimitiveType, false);
      assert.strictEqual(model.isFreeFormObject, false);
      assert.strictEqual(model.isAlias, false);
    });

    it('should set validation and deprecation flags', () => {
      const model = createCodegenModel('Test', 'Test');

      assert.strictEqual(model.isDeprecated, false);
      assert.strictEqual(model.isNullable, false);
      assert.strictEqual(model.hasValidation, false);
    });
  });

  describe('CodegenModel interface', () => {
    it('should allow setting vars', () => {
      const model = createCodegenModel('Pet', 'Pet');
      model.vars = [
        {
          name: 'id',
          baseName: 'id',
          dataType: 'number',
          required: true,
          isPrimitiveType: true,
          isContainer: false,
          isString: false,
          isNumeric: true,
          isInteger: true,
          isLong: false,
          isNumber: false,
          isFloat: false,
          isDouble: false,
          isDecimal: false,
          isByteArray: false,
          isBinary: false,
          isFile: false,
          isBoolean: false,
          isDate: false,
          isDateTime: false,
          isUuid: false,
          isUri: false,
          isEmail: false,
          isPassword: false,
          isFreeFormObject: false,
          isAnyType: false,
          isArray: false,
          isMap: false,
          isEnum: false,
          isInnerEnum: false,
          isEnumRef: false,
          isModel: false,
          isReadOnly: false,
          isWriteOnly: false,
          isNullable: false,
          isSelfReference: false,
          isCircularReference: false,
          isDiscriminator: false,
          isNew: false,
          isOverridden: false,
          isUnboundedInteger: false,
          hasMore: false,
          hasValidation: false,
          hasItems: false,
          isShort: false,
          isUnboundedNumber: false,
          isVoid: false,
          isNull: false,
          hasMultipleTypes: false,
          vendorExtensions: {},
        },
      ];

      assert.strictEqual(model.vars.length, 1);
      assert.strictEqual(model.vars[0].name, 'id');
    });

    it('should allow setting parent', () => {
      const model = createCodegenModel('Dog', 'Dog');
      model.parent = 'Animal';
      model.parentModel = createCodegenModel('Animal', 'Animal');

      assert.strictEqual(model.parent, 'Animal');
      assert.ok(model.parentModel);
      assert.strictEqual(model.parentModel.name, 'Animal');
    });

    it('should allow setting oneOf/anyOf/allOf', () => {
      const model = createCodegenModel('Pet', 'Pet');
      model.oneOf = new Set(['Cat', 'Dog']);
      model.anyOf = new Set(['Animal']);
      model.allOf = new Set(['Named', 'Tagged']);

      assert.ok(model.oneOf.has('Cat'));
      assert.ok(model.oneOf.has('Dog'));
      assert.ok(model.anyOf.has('Animal'));
      assert.ok(model.allOf.has('Named'));
      assert.ok(model.allOf.has('Tagged'));
    });
  });
});
