/**
 * Represents a schema/model in the OpenAPI spec
 */
import type { CodegenProperty, AllowableValues } from './codegen-property.js';

export interface CodegenDiscriminator {
  propertyName: string;
  propertyBaseName: string;
  propertyType?: string;
  mapping?: Record<string, string>;
  mappedModels?: Array<{
    modelName: string;
    mappingName: string;
  }>;
  isEnum?: boolean;
}

export interface CodegenModel {
  // Naming
  name: string;
  schemaName: string;
  classname: string;
  classFilename?: string;
  title?: string;
  description?: string;
  unescapedDescription?: string;

  // Inheritance
  parent?: string;
  parentSchema?: string;
  parentModel?: CodegenModel;
  allParents: string[];
  interfaces: string[];
  interfaceModels?: CodegenModel[];
  children?: CodegenModel[];
  hasChildren: boolean;

  // Composition (OAS 3.0)
  anyOf: string[];
  oneOf: string[];
  allOf: string[];
  composedSchemas?: ComposedSchemas;
  hasDiscriminatorWithNonEmptyMapping: boolean;

  // Discriminator
  discriminator?: CodegenDiscriminator;

  // Property collections
  vars: CodegenProperty[];
  allVars: CodegenProperty[];
  requiredVars: CodegenProperty[];
  optionalVars: CodegenProperty[];
  readOnlyVars: CodegenProperty[];
  readWriteVars: CodegenProperty[];
  parentVars: CodegenProperty[];
  nonNullableVars: CodegenProperty[];

  // Type flags
  isString: boolean;
  isInteger: boolean;
  isLong: boolean;
  isNumber: boolean;
  isNumeric: boolean;
  isFloat: boolean;
  isDouble: boolean;
  isDecimal: boolean;
  isBoolean: boolean;
  isDate: boolean;
  isDateTime: boolean;
  isByteArray: boolean;
  isBinary: boolean;
  isFile: boolean;
  isUuid: boolean;
  isUri: boolean;
  isEmail: boolean;
  isNull: boolean;
  isVoid: boolean;
  isAnyType: boolean;
  isPrimitiveType: boolean;
  isModel: boolean;
  isFreeFormObject: boolean;
  isAlias: boolean;

  // Enum
  isEnum: boolean;
  allowableValues?: AllowableValues;

  // Container types
  isContainer: boolean;
  isArray: boolean;
  isMap: boolean;
  isSet: boolean;
  arrayModelType?: string;
  items?: CodegenProperty;
  additionalPropertiesType?: string;
  additionalProperties?: CodegenProperty;
  isAdditionalPropertiesTrue: boolean;

  // XML
  xmlPrefix?: string;
  xmlName?: string;
  xmlNamespace?: string;
  isXmlWrapped?: boolean;

  // Constraints
  maxLength?: number;
  minLength?: number;
  minimum?: string;
  maximum?: string;
  pattern?: string;
  multipleOf?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;

  // Status
  isDeprecated: boolean;
  isNullable: boolean;
  hasValidation: boolean;

  // External docs
  externalDocs?: ExternalDocumentation;

  // Imports
  imports: Set<string>;

  // Vendor extensions
  vendorExtensions: Record<string, unknown>;

  // Template helpers
  hasVars: boolean;
  hasEnums: boolean;
  hasRequired: boolean;
  hasOptional: boolean;
  hasReadOnly: boolean;
  hasOnlyReadOnly: boolean;

  // Names in different formats
  classVarName?: string;
  modelJson?: string;
}

export interface ComposedSchemas {
  oneOf?: CodegenProperty[];
  anyOf?: CodegenProperty[];
  allOf?: CodegenProperty[];
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

export function createCodegenModel(name: string, classname: string): CodegenModel {
  return {
    name,
    schemaName: name,
    classname,
    allParents: [],
    interfaces: [],
    hasChildren: false,
    anyOf: [],
    oneOf: [],
    allOf: [],
    hasDiscriminatorWithNonEmptyMapping: false,
    vars: [],
    allVars: [],
    requiredVars: [],
    optionalVars: [],
    readOnlyVars: [],
    readWriteVars: [],
    parentVars: [],
    nonNullableVars: [],
    isString: false,
    isInteger: false,
    isLong: false,
    isNumber: false,
    isNumeric: false,
    isFloat: false,
    isDouble: false,
    isDecimal: false,
    isBoolean: false,
    isDate: false,
    isDateTime: false,
    isByteArray: false,
    isBinary: false,
    isFile: false,
    isUuid: false,
    isUri: false,
    isEmail: false,
    isNull: false,
    isVoid: false,
    isAnyType: false,
    isPrimitiveType: false,
    isModel: true,
    isFreeFormObject: false,
    isAlias: false,
    isEnum: false,
    isContainer: false,
    isArray: false,
    isMap: false,
    isSet: false,
    isAdditionalPropertiesTrue: false,
    isDeprecated: false,
    isNullable: false,
    hasValidation: false,
    imports: new Set(),
    vendorExtensions: {},
    hasVars: false,
    hasEnums: false,
    hasRequired: false,
    hasOptional: false,
    hasReadOnly: false,
    hasOnlyReadOnly: false,
  };
}
