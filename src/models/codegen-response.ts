/**
 * Represents an API response
 */
import type { CodegenProperty } from './codegen-property.js';

export interface CodegenResponse {
  // HTTP status
  code: string;
  is1xx: boolean;
  is2xx: boolean;
  is3xx: boolean;
  is4xx: boolean;
  is5xx: boolean;
  isDefault: boolean;

  // Documentation
  message: string;
  description?: string;

  // Response body
  dataType?: string;
  baseType?: string;
  containerType?: string;

  // Type flags
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

  // Container types
  isArray: boolean;
  isMap: boolean;

  // Schema info
  schema?: CodegenProperty;
  headers: CodegenProperty[];

  // Content types
  content?: Map<string, MediaType>;

  // For templates
  hasMore?: boolean;

  // Vendor extensions
  vendorExtensions: Record<string, unknown>;
}

export interface MediaType {
  schema?: CodegenProperty;
  example?: unknown;
  examples?: Record<string, unknown>;
  encoding?: Record<string, EncodingInfo>;
}

export interface EncodingInfo {
  contentType?: string;
  headers?: Record<string, CodegenProperty>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export function createCodegenResponse(code: string, message: string): CodegenResponse {
  const codeNum = parseInt(code, 10);
  return {
    code,
    message,
    is1xx: codeNum >= 100 && codeNum < 200,
    is2xx: codeNum >= 200 && codeNum < 300,
    is3xx: codeNum >= 300 && codeNum < 400,
    is4xx: codeNum >= 400 && codeNum < 500,
    is5xx: codeNum >= 500 && codeNum < 600,
    isDefault: code === 'default',
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
    isArray: false,
    isMap: false,
    headers: [],
    vendorExtensions: {},
  };
}
