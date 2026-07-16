/**
 * Represents a property/field in a model
 */
export interface CodegenProperty {
	// OpenAPI metadata
	openApiType?: string;
	baseName: string;
	dataType: string;
	datatype: string; // Alias for templates (lowercase)
	baseType?: string; // Base type for container types
	datatypeWithEnum?: string;
	/** Suffix used to name an inline enum, e.g. "StatusEnum". */
	enumName?: string;
	name: string;

	// Documentation
	description?: string;
	unescapedDescription?: string;
	title?: string;
	example?: string;
	defaultValue?: string;

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
	/** TypeScript template contract; mirrors isDate/isDateTime. */
	isDateType?: boolean;
	isDateTimeType?: boolean;
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
	isReadOnly: boolean;
	isWriteOnly: boolean;
	isNullable: boolean;
	isSelfReference: boolean;
	isCircularReference: boolean;

	// Container types
	isContainer: boolean;
	isArray: boolean;
	isMap: boolean;
	isSet: boolean;
	containerType?: string;
	containerTypeMapped?: string;

	// For array/map items
	items?: CodegenProperty;
	additionalProperties?: CodegenProperty;

	// Status flags
	required: boolean;
	deprecated: boolean;

	// Reference info
	ref?: string;
	complexType?: string;

	// Enum values
	allowableValues?: AllowableValues;

	// XML
	isXmlAttribute?: boolean;
	xmlPrefix?: string;
	xmlName?: string;
	xmlNamespace?: string;
	isXmlWrapped?: boolean;

	// Vendor extensions
	vendorExtensions: Record<string, unknown>;

	// Helper flags for templates
	hasMore?: boolean;
	hasValidation: boolean;
	isInherited: boolean;
	discriminatorValue?: string;

	// Names in different formats (for convenience in templates)
	nameInCamelCase?: string;
	nameInPascalCase?: string;
	nameInSnakeCase?: string;

	// Getter/setter names
	getter?: string;
	setter?: string;
}

export interface AllowableValues {
	enumVars?: Array<{
		name: string;
		value: string;
		isString?: boolean;
	}>;
	values?: Array<string | number | boolean>;
}

export function createCodegenProperty(
	baseName: string,
	dataType: string,
): CodegenProperty {
	return {
		baseName,
		dataType,
		datatype: dataType, // Lowercase alias for templates
		name: baseName,
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
		isReadOnly: false,
		isWriteOnly: false,
		isNullable: false,
		isSelfReference: false,
		isCircularReference: false,
		isContainer: false,
		isArray: false,
		isMap: false,
		isSet: false,
		required: false,
		deprecated: false,
		vendorExtensions: {},
		hasValidation: false,
		isInherited: false,
	};
}
