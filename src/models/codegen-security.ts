/**
 * Represents a security scheme
 */
export interface CodegenSecurity {
	name: string;
	type: string;
	scheme?: string;
	description?: string;

	// Type flags
	isBasic: boolean;
	isBasicBasic: boolean;
	isBasicBearer: boolean;
	isHttpSignature: boolean;
	isApiKey: boolean;
	isOAuth: boolean;
	isOpenIdConnect: boolean;

	// API Key specific
	keyParamName?: string;
	isKeyInQuery: boolean;
	isKeyInHeader: boolean;
	isKeyInCookie: boolean;

	// OAuth specific
	flow?: string;
	authorizationUrl?: string;
	tokenUrl?: string;
	refreshUrl?: string;
	scopes?: CodegenSecurityScope[];

	// Bearer specific
	bearerFormat?: string;

	// OpenID Connect specific
	openIdConnectUrl?: string;

	// Vendor extensions
	vendorExtensions: Record<string, unknown>;
}

export interface CodegenSecurityScope {
	scope: string;
	description?: string;
}

export function createCodegenSecurity(
	name: string,
	type: string,
): CodegenSecurity {
	return {
		name,
		type,
		isBasic: false,
		isBasicBasic: false,
		isBasicBearer: false,
		isHttpSignature: false,
		isApiKey: false,
		isOAuth: false,
		isOpenIdConnect: false,
		isKeyInQuery: false,
		isKeyInHeader: false,
		isKeyInCookie: false,
		vendorExtensions: {},
	};
}
