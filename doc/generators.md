# Available Generators

## typescript-fetch

Generates TypeScript client code using the Fetch API.

### Source

Ported from: `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/TypeScriptFetchClientCodegen.java`

Templates: `modules/openapi-generator/src/main/resources/typescript-fetch/`

### Metadata

| Property | Value |
|----------|-------|
| Name | typescript-fetch |
| Type | client |
| Language | TypeScript |
| Libraries | default, es6-fetch |
| Default Library | default |

### Type Mappings

| OpenAPI Type | TypeScript Type |
|--------------|-----------------|
| integer, long, float, double, number, decimal | `number` |
| string, uuid, uri, email, password | `string` |
| boolean | `boolean` |
| date, date-time | `string` |
| DateTime, Date | `Date` |
| binary | `Blob` |
| file, File | `File` |
| array, list | `Array` |
| set | `Set` |
| map | `Record` |
| object | `object` |
| AnyType | `any` |

### Generated Files

- `index.ts` - Main entry point
- `runtime.ts` - HTTP runtime
- `configuration.ts` - Client configuration
- `package.json` - NPM package file
- `tsconfig.json` - TypeScript configuration
- `apis/index.ts` - API classes
- `models/index.ts` - Model types

### Additional Properties

| Property | Default | Description |
|----------|---------|-------------|
| `supportsES6` | `true` | Use ES6 features |
| `useSingleRequestParameter` | `true` | Use single request parameter object |
| `withInterfaces` | `true` | Generate interfaces |
| `npmName` | package name | NPM package name |
| `npmVersion` | `1.0.0` | NPM package version |

---

## python

Generates Python client code using urllib3, asyncio, or httpx.

### Source

Ported from:
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/PythonClientCodegen.java`
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/AbstractPythonCodegen.java`

Templates: `modules/openapi-generator/src/main/resources/python/`

### Metadata

| Property | Value |
|----------|-------|
| Name | python |
| Type | client |
| Language | Python |
| Libraries | urllib3, asyncio, httpx |
| Default Library | urllib3 |

### Type Mappings

| OpenAPI Type | Python Type |
|--------------|-------------|
| integer, long | `int` |
| float, double, number | `float` |
| string | `str` |
| boolean | `bool` |
| date | `date` |
| DateTime, date-time | `datetime` |
| binary, ByteArray, file | `bytearray` |
| byte | `str` |
| File | `file` |
| uuid, UUID, uri, URI, email, password | `str` |
| array, list, set | `List` |
| map | `Dict` |
| object | `object` |
| AnyType | `object` |
| null | `None` |
| decimal | `Decimal` |

### Import Mappings

| Type | Module |
|------|--------|
| datetime | `datetime` |
| date | `datetime` |
| Decimal | `decimal` |

### Reserved Words

Python reserved words plus Pydantic-specific and API method local variables:

- Python keywords: `and`, `as`, `assert`, `async`, `await`, `break`, `class`, `continue`, `def`, `del`, `elif`, `else`, `except`, `finally`, `for`, `from`, `global`, `if`, `import`, `in`, `is`, `lambda`, `nonlocal`, `not`, `or`, `pass`, `raise`, `return`, `try`, `while`, `with`, `yield`, `True`, `False`, `None`
- Pydantic: `field`
- Built-in types: `schema`, `base64`, `json`, `date`, `float`, `property`
- Local variables: `all_params`, `resource_path`, `path_params`, `query_params`, `header_params`, `form_params`, `local_var_files`, `body_params`, `auth_settings`

### Generated Files

- `{{packageName}}/__init__.py` - Package init
- `{{packageName}}/models/__init__.py` - Models init
- `{{packageName}}/api/__init__.py` - API init
- `{{packageName}}/api_client.py` - API client
- `{{packageName}}/api_response.py` - API response
- `{{packageName}}/configuration.py` - Configuration
- `{{packageName}}/exceptions.py` - Exceptions
- `{{packageName}}/rest.py` - REST client
- `{{packageName}}/py.typed` - PEP 561 marker
- `requirements.txt` - Dependencies
- `test-requirements.txt` - Test dependencies
- `setup.py` - Setup script
- `pyproject.toml` - Project configuration
- `README.md` - Documentation
- `.gitignore` - Git ignore

### Additional Properties

| Property | Default | Description |
|----------|---------|-------------|
| `packageName` | `openapi_client` | Python package name |
| `packageVersion` | `1.0.0` | Package version |
| `projectName` | derived from package | Project name (kebab-case) |
| `packageUrl` | - | Package URL |
| `hideGenerationTimestamp` | `true` | Hide generation timestamp |
| `recursionLimit` | - | Set recursion limit |
| `datetimeFormat` | `%Y-%m-%dT%H:%M:%S.%f%z` | Datetime format |
| `dateFormat` | `%Y-%m-%d` | Date format |
| `useOneOfDiscriminatorLookup` | `false` | Use discriminator for oneOf |
| `mapNumberTo` | `Union[StrictFloat, StrictInt]` | Number type mapping |

---

## go

Generates Go client code.

### Source

Ported from:
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/GoClientCodegen.java`
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/AbstractGoCodegen.java`

Templates: `modules/openapi-generator/src/main/resources/go/`

### Metadata

| Property | Value |
|----------|-------|
| Name | go |
| Type | client |
| Language | Go |
| Libraries | default |
| Default Library | default |

### Type Mappings

| OpenAPI Type | Go Type |
|--------------|---------|
| integer | `int32` |
| long | `int64` |
| number, float | `float32` |
| double, decimal | `float64` |
| boolean | `bool` |
| string, UUID, URI, date, password | `string` |
| DateTime | `time.Time` |
| File, file, binary | `*os.File` |
| ByteArray | `string` |
| null | `nil` |
| object | `map[string]interface{}` |
| AnyType | `interface{}` |

### Import Mappings

| Type | Package |
|------|---------|
| time.Time | `time` |
| *os.File | `os` |

### Reserved Words

Go keywords plus data types:

- Data types: `string`, `bool`, `uint`, `uint8`, `uint16`, `uint32`, `uint64`, `int`, `int8`, `int16`, `int32`, `int64`, `float32`, `float64`, `complex64`, `complex128`, `rune`, `byte`, `uintptr`
- Keywords: `break`, `default`, `func`, `interface`, `select`, `case`, `defer`, `go`, `map`, `struct`, `chan`, `else`, `goto`, `package`, `switch`, `const`, `fallthrough`, `if`, `range`, `type`, `continue`, `for`, `import`, `return`, `var`, `error`, `nil`

### Generated Files

- `README.md` - Documentation
- `.gitignore` - Git ignore
- `git_push.sh` - Git push script
- `configuration.go` - Configuration
- `client.go` - HTTP client
- `response.go` - Response wrapper
- `utils.go` - Utilities
- `go.mod` - Go module file
- `go.sum` - Go dependencies checksum
- `.travis.yml` - Travis CI config

### Additional Properties

| Property | Default | Description |
|----------|---------|-------------|
| `packageName` | `openapi` | Go package name |
| `packageVersion` | `1.0.0` | Package version |
| `hideGenerationTimestamp` | `true` | Hide generation timestamp |
| `withGoMod` | `true` | Generate go.mod and go.sum |
| `withXml` | `false` | Include XML support |
| `withAWSV4Signature` | `false` | Include AWS v4 signature support |
| `enumClassPrefix` | `false` | Prefix enum values with type name |
| `structPrefix` | `false` | Prefix structs with class name |
| `generateInterfaces` | `false` | Generate interfaces for APIs |
| `useOneOfDiscriminatorLookup` | `false` | Use discriminator for oneOf |
| `generateMarshalJSON` | `true` | Generate MarshalJSON methods |
| `generateUnmarshalJSON` | `true` | Generate UnmarshalJSON methods |
| `goImportAlias` | `openapiclient` | Import alias for generated package |

---

## php

Generates PHP client code using Guzzle or PSR-18.

### Source

Ported from:
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/PhpClientCodegen.java`
- `modules/openapi-generator/src/main/java/org/openapitools/codegen/languages/AbstractPhpCodegen.java`

Templates: `modules/openapi-generator/src/main/resources/php/`

### Metadata

| Property | Value |
|----------|-------|
| Name | php |
| Type | client |
| Language | PHP |
| Libraries | guzzle, psr-18 |
| Default Library | guzzle |

### Type Mappings

| OpenAPI Type | PHP Type |
|--------------|----------|
| integer, long | `int` |
| number, float, decimal, double | `float` |
| string | `string` |
| byte | `int` |
| boolean | `bool` |
| date, Date, DateTime | `\DateTime` |
| file | `\SplFileObject` |
| map, array, list | `array` |
| object | `object` |
| binary, ByteArray | `string` |
| UUID, URI | `string` |
| AnyType | `mixed` |

### Reserved Words

PHP reserved words plus local API method variables:

- Local variables: `resourcePath`, `httpBody`, `queryParams`, `headerParams`, `formParams`, `_header_accept`, `_tempBody`
- PHP keywords: `__halt_compiler`, `abstract`, `and`, `array`, `as`, `break`, `callable`, `case`, `catch`, `class`, `clone`, `const`, `continue`, `declare`, `default`, `die`, `do`, `echo`, `else`, `elseif`, `empty`, `enddeclare`, `endfor`, `endforeach`, `endif`, `endswitch`, `endwhile`, `eval`, `exit`, `extends`, `final`, `for`, `foreach`, `function`, `global`, `goto`, `if`, `implements`, `include`, `include_once`, `instanceof`, `insteadof`, `interface`, `isset`, `list`, `namespace`, `new`, `or`, `print`, `private`, `protected`, `public`, `require`, `require_once`, `return`, `static`, `switch`, `throw`, `trait`, `try`, `unset`, `use`, `var`, `while`, `xor`

### Generated Files

- `{{srcBasePath}}/ApiException.php` - API exception class
- `{{srcBasePath}}/Configuration.php` - Configuration class
- `{{srcBasePath}}/FormDataProcessor.php` - Form data processor
- `{{srcBasePath}}/ObjectSerializer.php` - Object serializer
- `{{srcBasePath}}/Model/ModelInterface.php` - Model interface
- `{{srcBasePath}}/HeaderSelector.php` - Header selector
- `composer.json` - Composer package file
- `README.md` - Documentation
- `phpunit.xml.dist` - PHPUnit configuration
- `.travis.yml` - Travis CI config
- `.php-cs-fixer.dist.php` - PHP CS Fixer config
- `git_push.sh` - Git push script
- `.gitignore` - Git ignore

### Additional Properties

| Property | Default | Description |
|----------|---------|-------------|
| `invokerPackage` | `OpenAPI\Client` | Main namespace for all classes |
| `packageName` | `OpenAPIClient-php` | Package name |
| `srcBasePath` | `lib` | Source root directory |
| `testBasePath` | `test` | Test root directory |
| `variableNamingConvention` | `snake_case` | Variable naming (snake_case, camelCase, PascalCase, original) |
| `artifactVersion` | `1.0.0` | Composer package version |
| `artifactUrl` | `https://openapi-generator.tech` | Package URL |
| `licenseName` | `unlicense` | License name |
| `developerOrganization` | `OpenAPI` | Developer organization |
| `hideGenerationTimestamp` | `true` | Hide generation timestamp |
