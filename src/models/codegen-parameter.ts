/**
 * Represents a parameter in an API operation
 */
import type { CodegenProperty, AllowableValues } from './codegen-property.js';

export interface CodegenParameter {
  // Basic info
  paramName: string;
  baseName: string;
  dataType: string;
  datatypeWithEnum?: string;
  description?: string;
  unescapedDescription?: string;

  // Parameter location
  isPathParam: boolean;
  isQueryParam: boolean;
  isHeaderParam: boolean;
  isCookieParam: boolean;
  isBodyParam: boolean;
  isFormParam: boolean;

  // Type flags (inherited from property concept)
  isString: boolean;
  isNumeric: boolean;
  isInteger: boolean;
  isLong: boolean;
  isNumber: boolean;
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
  isEnum: boolean;
  isEnumRef: boolean;

  // Container types
  isContainer: boolean;
  isArray: boolean;
  isMap: boolean;
  isSet: boolean;
  containerType?: string;

  // For array items
  items?: CodegenProperty;

  // Status flags
  required: boolean;
  isNullable: boolean;
  deprecated: boolean;

  // Constraints
  maxLength?: number;
  minLength?: number;
  minimum?: string;
  maximum?: string;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;

  // Additional info
  example?: string;
  defaultValue?: string;
  style?: string;
  explode?: boolean;
  allowEmptyValue?: boolean;
  allowReserved?: boolean;

  // Enum values
  allowableValues?: AllowableValues;

  // Content type for body parameters
  contentType?: string;

  // Reference info
  ref?: string;
  complexType?: string;

  // XML
  isXmlAttribute?: boolean;
  xmlPrefix?: string;
  xmlName?: string;
  xmlNamespace?: string;
  isXmlWrapped?: boolean;

  // Vendor extensions
  vendorExtensions: Record<string, unknown>;

  // Template helpers
  hasMore?: boolean;
  hasValidation: boolean;
  nameInCamelCase?: string;
  nameInPascalCase?: string;
  nameInSnakeCase?: string;
}

export function createCodegenParameter(baseName: string, dataType: string): CodegenParameter {
  return {
    paramName: baseName,
    baseName,
    dataType,
    isPathParam: false,
    isQueryParam: false,
    isHeaderParam: false,
    isCookieParam: false,
    isBodyParam: false,
    isFormParam: false,
    isString: false,
    isNumeric: false,
    isInteger: false,
    isLong: false,
    isNumber: false,
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
    isModel: false,
    isEnum: false,
    isEnumRef: false,
    isContainer: false,
    isArray: false,
    isMap: false,
    isSet: false,
    required: false,
    isNullable: false,
    deprecated: false,
    vendorExtensions: {},
    hasValidation: false,
  };
}
