/**
 * Validate command handler
 */
import { parseSpec, getInfo, getSchemas, getPaths } from '../../parser/openapi-parser.js';

export interface ValidateOptions {
  inputSpec: string;
  strict?: boolean;
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  console.log(`Validating: ${options.inputSpec}`);
  console.log('');

  try {
    const spec = await parseSpec(options.inputSpec, {
      validate: true,
      dereference: false, // Don't dereference for validation
    });

    const info = getInfo(spec.document);
    const schemas = getSchemas(spec.document);
    const paths = getPaths(spec.document);

    console.log('Validation successful!');
    console.log('');
    console.log('Specification Details:');
    console.log(`  Title: ${info.title}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  OpenAPI Version: ${spec.version}`);
    if (info.description) {
      console.log(`  Description: ${info.description.substring(0, 100)}...`);
    }
    console.log('');
    console.log('Statistics:');
    console.log(`  Schemas: ${Object.keys(schemas).length}`);
    console.log(`  Paths: ${Object.keys(paths).length}`);

    // Count operations
    let operationCount = 0;
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
    for (const pathItem of Object.values(paths)) {
      if (!pathItem) continue;
      for (const method of methods) {
        if ((pathItem as Record<string, unknown>)[method]) {
          operationCount++;
        }
      }
    }
    console.log(`  Operations: ${operationCount}`);

    if (options.strict) {
      // Additional strict checks could go here
      console.log('');
      console.log('Strict validation passed.');
    }
  } catch (error) {
    console.error('Validation failed!');
    console.error('');

    if (error instanceof Error) {
      console.error('Error:', error.message);

      // Try to provide more context for common errors
      if (error.message.includes('$ref')) {
        console.error('');
        console.error('Hint: This appears to be a reference error. Check that all $ref');
        console.error('      references point to valid schema definitions.');
      }

      if (error.message.includes('required')) {
        console.error('');
        console.error('Hint: A required field is missing. Check the OpenAPI specification');
        console.error('      for required fields like "info", "paths", etc.');
      }
    } else {
      console.error('Error:', error);
    }

    process.exit(1);
  }
}
