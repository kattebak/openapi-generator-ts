/**
 * String transformation lambdas for templates
 * These map to the Java Mustache lambdas in the original implementation
 */
import {
  camelCase,
  snakeCase,
  kebabCase,
  pascalCase,
  startCase,
  capitalize,
} from 'es-toolkit/string';

/**
 * Convert string to lowercase
 */
export function lowercase(text: string): string {
  return text.toLowerCase();
}

/**
 * Convert string to UPPERCASE
 */
export function uppercase(text: string): string {
  return text.toUpperCase();
}

/**
 * Convert string to camelCase
 */
export function camelcase(text: string): string {
  return camelCase(text);
}

/**
 * Convert string to PascalCase
 */
export function pascalcase(text: string): string {
  return pascalCase(text);
}

/**
 * Convert string to snake_case
 */
export function snakecase(text: string): string {
  return snakeCase(text);
}

/**
 * Convert string to SCREAMING_SNAKE_CASE
 */
export function screamingSnakecase(text: string): string {
  return snakeCase(text).toUpperCase();
}

/**
 * Convert string to kebab-case
 */
export function kebabcase(text: string): string {
  return kebabCase(text);
}

/**
 * Convert string to Title Case
 */
export function titlecase(text: string): string {
  return startCase(text);
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(text: string): string {
  return capitalize(text);
}

/**
 * Lowercase first letter
 */
export function lowercaseFirst(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Convert camelCase to words separated by spaces
 * e.g., "camelCaseText" -> "camel Case Text"
 */
export function uncamelize(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Remove specific characters from text
 */
export function removeSpecialChars(text: string): string {
  return text.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Double quote the text
 */
export function doublequote(text: string): string {
  return `"${text}"`;
}

/**
 * Single quote the text
 */
export function singlequote(text: string): string {
  return `'${text}'`;
}

/**
 * Escape double quotes in text
 */
export function escapeDoubleQuotes(text: string): string {
  return text.replace(/"/g, '\\"');
}

/**
 * Escape single quotes in text
 */
export function escapeSingleQuotes(text: string): string {
  return text.replace(/'/g, "\\'");
}

/**
 * Replace backslashes with forward slashes
 */
export function forwardslash(text: string): string {
  return text.replace(/\\/g, '/');
}

/**
 * Replace forward slashes with backslashes
 */
export function backslash(text: string): string {
  return text.replace(/\//g, '\\');
}

/**
 * Create all string lambdas
 */
export function createStringLambdas(): Record<string, (text: string) => string> {
  return {
    lowercase,
    uppercase,
    camelcase,
    camelCase: camelcase,
    pascalcase,
    pascalCase: pascalcase,
    snakecase,
    snake_case: snakecase,
    screamingSnakecase,
    screaming_snake_case: screamingSnakecase,
    kebabcase,
    'kebab-case': kebabcase,
    titlecase,
    titleCase: titlecase,
    capitalizeFirst,
    lowercaseFirst,
    uncamelize,
    removeSpecialChars,
    doublequote,
    singlequote,
    escapeDoubleQuotes,
    escapeSingleQuotes,
    forwardslash,
    backslash,
  };
}
