#!/usr/bin/env bash
#
# Template Sync Script
#
# Syncs Mustache templates from the original OpenAPI Generator Java project
# and converts them to Handlebars-compatible format.
#
# Usage:
#   ./scripts/sync-templates.sh [options]
#
# Options:
#   -g, --generators <list>  Comma-separated list of generators (default: all)
#   -r, --repo <url>         Git repository URL (default: official OpenAPI Generator)
#   -b, --branch <name>      Git branch (default: master)
#   -c, --clean              Remove existing templates before syncing
#   -n, --dry-run            Show what would be done without making changes
#   -h, --help               Show this help message
#

set -euo pipefail

# Configuration
DEFAULT_REPO="https://github.com/OpenAPITools/openapi-generator.git"
DEFAULT_BRANCH="master"
TEMPLATES_SOURCE_PATH="modules/openapi-generator/src/main/resources"

# Generator configurations: source_dir:target_dir
declare -A GENERATOR_CONFIGS=(
  ["typescript-fetch"]="typescript-fetch:typescript-fetch"
  ["python"]="python:python"
  ["go"]="go:go"
  ["php"]="php:php"
)

# Script directory and package root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$PACKAGE_DIR/templates"
CACHE_DIR="$PACKAGE_DIR/.template-cache"

# Default options
GENERATORS=""
REPO="$DEFAULT_REPO"
BRANCH="$DEFAULT_BRANCH"
CLEAN=false
DRY_RUN=false

show_help() {
  cat << EOF
Template Sync Script - Sync templates from OpenAPI Generator

Usage:
  ./scripts/sync-templates.sh [options]

Options:
  -g, --generators <list>  Comma-separated list of generators (default: all)
                           Available: ${!GENERATOR_CONFIGS[*]}
  -r, --repo <url>         Git repository URL
  -b, --branch <name>      Git branch (default: master)
  -c, --clean              Remove existing templates before syncing
  -n, --dry-run            Show what would be done without making changes
  -h, --help               Show this help message

Examples:
  ./scripts/sync-templates.sh                    # Sync all generators
  ./scripts/sync-templates.sh -g go,python       # Sync specific generators
  ./scripts/sync-templates.sh --clean            # Clean and re-sync all
  ./scripts/sync-templates.sh -n                 # Dry run
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -g|--generators)
      GENERATORS="$2"
      shift 2
      ;;
    -r|--repo)
      REPO="$2"
      shift 2
      ;;
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    -c|--clean)
      CLEAN=true
      shift
      ;;
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# If no generators specified, use all
if [[ -z "$GENERATORS" ]]; then
  GENERATORS="${!GENERATOR_CONFIGS[*]}"
else
  # Convert comma-separated to space-separated
  GENERATORS="${GENERATORS//,/ }"
fi

# Validate generator names
for gen in $GENERATORS; do
  if [[ ! -v GENERATOR_CONFIGS[$gen] ]]; then
    echo "Error: Unknown generator: $gen"
    echo "Available generators: ${!GENERATOR_CONFIGS[*]}"
    exit 1
  fi
done

echo "OpenAPI Generator Template Sync"
echo "================================"
echo "Generators: $GENERATORS"
echo "Repository: $REPO"
echo "Branch: $BRANCH"
if $DRY_RUN; then
  echo "DRY RUN - No changes will be made"
fi
echo ""

# Clone or update the source repository
ensure_source_repo() {
  if [[ -d "$CACHE_DIR" ]]; then
    echo "Updating existing clone in $CACHE_DIR..."
    if ! $DRY_RUN; then
      git -C "$CACHE_DIR" fetch origin "$BRANCH" --depth=1
      git -C "$CACHE_DIR" checkout FETCH_HEAD
    fi
  else
    echo "Shallow cloning $REPO (branch: $BRANCH)..."
    if ! $DRY_RUN; then
      git clone --depth=1 --branch="$BRANCH" --single-branch --filter=blob:none "$REPO" "$CACHE_DIR"
    fi
  fi
}

# Convert Mustache template syntax to Handlebars-compatible format
convert_mustache_to_handlebars() {
  local file="$1"

  # Remove delimiter changes (not supported in Handlebars)
  # Convert lambda syntax: {{#lambda.funcName}} -> {{#funcName}}
  # Convert inline lambda: {{lambda.funcName}} -> {{funcName}}
  sed -E \
    -e 's/\{\{=.+=\}\}//g' \
    -e 's/\{\{#lambda\.([a-zA-Z_]+)\}\}/{{#\1}}/g' \
    -e 's/\{\{\/lambda\.([a-zA-Z_]+)\}\}/{{\/\1}}/g' \
    -e 's/\{\{lambda\.([a-zA-Z_]+)\}\}/{{\1}}/g' \
    "$file"
}

# Sync templates for a single generator
sync_generator() {
  local generator_name="$1"
  local config="${GENERATOR_CONFIGS[$generator_name]}"
  local source_dir="${config%%:*}"
  local target_dir="${config##*:}"

  local source_path="$CACHE_DIR/$TEMPLATES_SOURCE_PATH/$source_dir"
  local target_path="$TEMPLATES_DIR/$target_dir"

  echo ""
  echo "Syncing $generator_name..."
  echo "  Source: $source_path"
  echo "  Target: $target_path"

  if [[ ! -d "$source_path" ]]; then
    echo "  Warning: Source directory not found, skipping"
    return
  fi

  # Clean target if requested
  if $CLEAN && [[ -d "$target_path" ]]; then
    echo "  Cleaning existing templates..."
    if ! $DRY_RUN; then
      rm -rf "$target_path"
    fi
  fi

  # Create target directory
  if ! $DRY_RUN; then
    mkdir -p "$target_path"
  fi

  # Copy and convert templates
  local copied=0
  local converted=0

  # Use find with exec to avoid subshell issues
  while IFS= read -r file; do
    local rel_path="${file#$source_path/}"
    local dest_file="$target_path/$rel_path"
    local dest_dir
    dest_dir=$(dirname "$dest_file")

    if ! $DRY_RUN; then
      mkdir -p "$dest_dir"

      # Check if it's a template file that needs conversion
      if [[ "$file" == *.mustache ]]; then
        local original
        original=$(cat "$file")
        local converted_content
        converted_content=$(convert_mustache_to_handlebars "$file")

        if [[ "$original" != "$converted_content" ]]; then
          ((converted++)) || true
        fi

        echo "$converted_content" > "$dest_file"
      else
        # Copy non-template files as-is
        cp "$file" "$dest_file"
      fi
    fi
    ((copied++)) || true
  done < <(find "$source_path" -type f)

  echo "  Copied $copied files ($converted templates converted)"
}

# Main execution
ensure_source_repo

# Create templates directory
if ! $DRY_RUN; then
  mkdir -p "$TEMPLATES_DIR"
fi

# Sync each generator
for generator in $GENERATORS; do
  sync_generator "$generator"
done

echo ""
echo "Template sync complete!"
echo "Templates are in: $TEMPLATES_DIR"
