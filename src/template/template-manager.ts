/**
 * Template Manager
 * Handles template loading, compilation, and rendering
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import fsExtra from 'fs-extra';
import fg from 'fast-glob';
import type {
  TemplateManagerOptions,
  TemplatePathLocator,
  CompiledTemplate,
  TemplateData,
  WriteOptions,
  GeneratedFile,
} from '../core/types.js';
import { HandlebarsAdapter, createTemplateEngine } from './engine-adapter.js';
import {
  createTemplateLocatorChain,
  resolveTemplatePath,
  type TemplateLocatorChainOptions,
} from './template-locator.js';

export interface TemplateManagerConfig {
  options: TemplateManagerOptions;
  locatorOptions: TemplateLocatorChainOptions;
}

export class TemplateManager {
  private engine: HandlebarsAdapter;
  private locators: TemplatePathLocator[];
  private options: TemplateManagerOptions;
  private compiledTemplates: Map<string, CompiledTemplate> = new Map();
  private loadedPartials: Set<string> = new Set();

  constructor(config: TemplateManagerConfig) {
    this.options = config.options;
    this.engine = createTemplateEngine();
    this.locators = createTemplateLocatorChain(config.locatorOptions);
  }

  /**
   * Get the path to a template file
   */
  getTemplatePath(templateName: string): string | null {
    return resolveTemplatePath(templateName, this.locators);
  }

  /**
   * Load and compile a template
   */
  async compile(templateName: string): Promise<CompiledTemplate> {
    // Check cache first
    const cached = this.compiledTemplates.get(templateName);
    if (cached) {
      return cached;
    }

    // Resolve template path
    const templatePath = this.getTemplatePath(templateName);
    if (!templatePath) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Load and compile
    const source = await fs.promises.readFile(templatePath, 'utf-8');

    // Register any partials referenced in the template
    await this.registerPartialsFromTemplate(source, path.dirname(templatePath));

    const compiled = this.engine.compile(source);
    this.compiledTemplates.set(templateName, compiled);

    return compiled;
  }

  /**
   * Render a template with data
   */
  async render(templateName: string, data: TemplateData): Promise<string> {
    const template = await this.compile(templateName);
    return template(data);
  }

  /**
   * Register partials referenced in a template
   * Partials are referenced as {{> partialName}}
   */
  private async registerPartialsFromTemplate(
    source: string,
    _templateDir: string
  ): Promise<void> {
    // Match partial references: {{> partialName}} or {{>partialName}}
    const partialRegex = /\{\{>\s*([a-zA-Z0-9_\-./]+)\s*\}\}/g;
    let match;

    while ((match = partialRegex.exec(source)) !== null) {
      const partialName = match[1];

      if (this.loadedPartials.has(partialName)) {
        continue;
      }

      // Try to find the partial
      const partialPath = this.getTemplatePath(partialName);
      if (partialPath) {
        const partialSource = await fs.promises.readFile(partialPath, 'utf-8');
        this.engine.registerPartial(partialName, partialSource);
        this.loadedPartials.add(partialName);

        // Recursively register partials from this partial
        await this.registerPartialsFromTemplate(partialSource, path.dirname(partialPath));
      }
    }
  }

  /**
   * Write generated content to a file
   */
  async writeFile(
    filePath: string,
    content: string,
    options?: WriteOptions
  ): Promise<GeneratedFile> {
    const opts = { ...this.options, ...options };

    // Dry run - don't write
    if (opts.dryRun) {
      return {
        path: filePath,
        content,
        skipped: false,
        reason: 'dry-run',
      };
    }

    // Check if file exists
    const exists = await fsExtra.pathExists(filePath);

    // Skip overwrite if configured
    if (exists && opts.skipOverwrite) {
      return {
        path: filePath,
        content,
        skipped: true,
        reason: 'skip-overwrite',
      };
    }

    // Minimal update - only write if content changed
    if (exists && opts.minimalUpdate) {
      const existingContent = await fs.promises.readFile(filePath, 'utf-8');
      if (existingContent === content) {
        return {
          path: filePath,
          content,
          skipped: true,
          reason: 'unchanged',
        };
      }
    }

    // Ensure directory exists and write file
    await fsExtra.ensureDir(path.dirname(filePath));
    await fs.promises.writeFile(filePath, content, 'utf-8');

    return {
      path: filePath,
      content,
      skipped: false,
    };
  }

  /**
   * Find all templates in a directory matching a pattern
   */
  async findTemplates(_pattern: string): Promise<string[]> {
    // This is a simplified approach - in production you might want to
    // expose the base path from locators for more efficient searching
    return [];
  }

  /**
   * Find all template files in the embedded templates directory
   */
  async findEmbeddedTemplates(
    embeddedDir: string,
    generatorName: string
  ): Promise<string[]> {
    const searchPath = path.join(embeddedDir, generatorName);

    if (!fs.existsSync(searchPath)) {
      return [];
    }

    const templates = await fg('**/*.{mustache,handlebars,hbs}', {
      cwd: searchPath,
      absolute: false,
    });

    return templates;
  }

  /**
   * Get the template engine
   */
  getEngine(): HandlebarsAdapter {
    return this.engine;
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, fn: (...args: unknown[]) => string): void {
    this.engine.registerHelper(name, fn);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, source: string): void {
    this.engine.registerPartial(name, source);
    this.loadedPartials.add(name);
  }

  /**
   * Clear compiled template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
    this.loadedPartials.clear();
  }
}

/**
 * Create a TemplateManager with default options
 */
export function createTemplateManager(config: TemplateManagerConfig): TemplateManager {
  return new TemplateManager(config);
}
