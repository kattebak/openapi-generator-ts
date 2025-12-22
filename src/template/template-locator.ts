/**
 * Template path resolution system
 * Implements the same priority chain as the Java implementation
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TemplatePathLocator } from '../core/types.js';

/**
 * Locator that searches for templates in a custom directory with library support
 */
export class CustomLibraryLocator implements TemplatePathLocator {
  constructor(
    private customDir: string,
    private library?: string
  ) {}

  getFullTemplatePath(name: string): string | null {
    if (!this.library) return null;

    const templatePath = path.join(this.customDir, 'libraries', this.library, name);
    return this.existsWithExtensions(templatePath);
  }

  private existsWithExtensions(basePath: string): string | null {
    const extensions = ['', '.mustache', '.handlebars', '.hbs'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

/**
 * Locator that searches for templates in a custom directory
 */
export class CustomGeneratorLocator implements TemplatePathLocator {
  constructor(private customDir: string) {}

  getFullTemplatePath(name: string): string | null {
    const templatePath = path.join(this.customDir, name);
    return this.existsWithExtensions(templatePath);
  }

  private existsWithExtensions(basePath: string): string | null {
    const extensions = ['', '.mustache', '.handlebars', '.hbs'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

/**
 * Locator that searches for templates in embedded resources with library support
 */
export class EmbeddedLibraryLocator implements TemplatePathLocator {
  constructor(
    private embeddedDir: string,
    private generatorName: string,
    private library?: string
  ) {}

  getFullTemplatePath(name: string): string | null {
    if (!this.library) return null;

    const templatePath = path.join(
      this.embeddedDir,
      this.generatorName,
      'libraries',
      this.library,
      name
    );
    return this.existsWithExtensions(templatePath);
  }

  private existsWithExtensions(basePath: string): string | null {
    const extensions = ['', '.mustache', '.handlebars', '.hbs'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

/**
 * Locator that searches for templates in embedded generator resources
 */
export class EmbeddedGeneratorLocator implements TemplatePathLocator {
  constructor(
    private embeddedDir: string,
    private generatorName: string
  ) {}

  getFullTemplatePath(name: string): string | null {
    const templatePath = path.join(this.embeddedDir, this.generatorName, name);
    return this.existsWithExtensions(templatePath);
  }

  private existsWithExtensions(basePath: string): string | null {
    const extensions = ['', '.mustache', '.handlebars', '.hbs'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

/**
 * Locator that searches for templates in common embedded resources
 */
export class CommonEmbeddedLocator implements TemplatePathLocator {
  constructor(private embeddedDir: string) {}

  getFullTemplatePath(name: string): string | null {
    const templatePath = path.join(this.embeddedDir, '_common', name);
    return this.existsWithExtensions(templatePath);
  }

  private existsWithExtensions(basePath: string): string | null {
    const extensions = ['', '.mustache', '.handlebars', '.hbs'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

export interface TemplateLocatorChainOptions {
  customDir?: string;
  embeddedDir: string;
  generatorName: string;
  library?: string;
}

/**
 * Create a chain of template locators with the correct priority order
 *
 * Resolution priority:
 * 1. custom/libraries/{library}/{template}
 * 2. custom/{template}
 * 3. embedded/{generator}/libraries/{library}/{template}
 * 4. embedded/{generator}/{template}
 * 5. embedded/_common/{template}
 */
export function createTemplateLocatorChain(
  options: TemplateLocatorChainOptions
): TemplatePathLocator[] {
  const locators: TemplatePathLocator[] = [];

  // Custom templates (highest priority)
  if (options.customDir) {
    if (options.library) {
      locators.push(new CustomLibraryLocator(options.customDir, options.library));
    }
    locators.push(new CustomGeneratorLocator(options.customDir));
  }

  // Embedded templates
  if (options.library) {
    locators.push(
      new EmbeddedLibraryLocator(options.embeddedDir, options.generatorName, options.library)
    );
  }
  locators.push(new EmbeddedGeneratorLocator(options.embeddedDir, options.generatorName));
  locators.push(new CommonEmbeddedLocator(options.embeddedDir));

  return locators;
}

/**
 * Resolve a template name using a chain of locators
 */
export function resolveTemplatePath(
  templateName: string,
  locators: TemplatePathLocator[]
): string | null {
  for (const locator of locators) {
    const path = locator.getFullTemplatePath(templateName);
    if (path) {
      return path;
    }
  }
  return null;
}
