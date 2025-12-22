/**
 * Represents an API operation
 */
import type { CodegenParameter } from './codegen-parameter.js';
import type { CodegenResponse } from './codegen-response.js';
import type { CodegenSecurity } from './codegen-security.js';
import type { ExternalDocumentation } from './codegen-model.js';

export interface CodegenOperation {
  // Basic info
  operationId: string;
  operationIdOriginal: string;
  operationIdCamelCase: string;
  operationIdSnakeCase: string;
  path: string;
  httpMethod: string;
  summary?: string;
  notes?: string;
  unescapedNotes?: string;

  // Return type
  returnType?: string;
  returnFormat?: string;
  returnBaseType?: string;
  returnContainer?: string;
  returnTypeIsPrimitive: boolean;
  returnSimpleType: boolean;

  // Tags
  baseName: string;
  tags: string[];

  // Parameter collections
  allParams: CodegenParameter[];
  pathParams: CodegenParameter[];
  queryParams: CodegenParameter[];
  headerParams: CodegenParameter[];
  cookieParams: CodegenParameter[];
  formParams: CodegenParameter[];
  bodyParams: CodegenParameter[];
  requiredParams: CodegenParameter[];
  optionalParams: CodegenParameter[];
  bodyParam?: CodegenParameter;

  // Request/Response
  responses: CodegenResponse[];
  defaultResponse?: CodegenResponse;
  successResponses: CodegenResponse[];
  errorResponses: CodegenResponse[];

  // Content types
  consumes: ContentType[];
  produces: ContentType[];
  hasConsumes: boolean;
  hasProduces: boolean;
  hasFormParams: boolean;
  hasBodyParam: boolean;
  hasPathParams: boolean;
  hasQueryParams: boolean;
  hasHeaderParams: boolean;
  hasCookieParams: boolean;

  // Multipart/form handling
  isMultipart: boolean;
  prioritizedContentTypes?: ContentType[];

  // Security
  authMethods: CodegenSecurity[];
  hasAuthMethods: boolean;

  // Status flags
  isDeprecated: boolean;
  hasOptionalParams: boolean;
  hasRequiredParams: boolean;

  // Servers
  servers: CodegenServer[];
  hasServers: boolean;

  // External docs
  externalDocs?: ExternalDocumentation;

  // Imports
  imports: Set<string>;

  // Callbacks
  callbacks?: Record<string, CodegenCallback>;
  hasCallbacks: boolean;

  // Vendor extensions
  vendorExtensions: Record<string, unknown>;

  // Template helpers
  hasMore?: boolean;
  nickname?: string;
}

export interface ContentType {
  mediaType: string;
  isJson?: boolean;
  isXml?: boolean;
  isForm?: boolean;
  isMultipart?: boolean;
  isBinary?: boolean;
  isText?: boolean;
}

export interface CodegenServer {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  defaultValue: string;
  description?: string;
  enumValues?: string[];
}

export interface CodegenCallback {
  name: string;
  urlExpression: string;
  operations: CodegenOperation[];
}

export function createCodegenOperation(
  operationId: string,
  path: string,
  httpMethod: string
): CodegenOperation {
  return {
    operationId,
    operationIdOriginal: operationId,
    operationIdCamelCase: operationId,
    operationIdSnakeCase: operationId,
    path,
    httpMethod: httpMethod.toUpperCase(),
    baseName: '',
    tags: [],
    returnTypeIsPrimitive: false,
    returnSimpleType: false,
    allParams: [],
    pathParams: [],
    queryParams: [],
    headerParams: [],
    cookieParams: [],
    formParams: [],
    bodyParams: [],
    requiredParams: [],
    optionalParams: [],
    responses: [],
    successResponses: [],
    errorResponses: [],
    consumes: [],
    produces: [],
    hasConsumes: false,
    hasProduces: false,
    hasFormParams: false,
    hasBodyParam: false,
    hasPathParams: false,
    hasQueryParams: false,
    hasHeaderParams: false,
    hasCookieParams: false,
    isMultipart: false,
    authMethods: [],
    hasAuthMethods: false,
    isDeprecated: false,
    hasOptionalParams: false,
    hasRequiredParams: false,
    servers: [],
    hasServers: false,
    hasCallbacks: false,
    imports: new Set(),
    vendorExtensions: {},
  };
}
