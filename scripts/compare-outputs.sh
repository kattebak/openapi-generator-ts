#!/usr/bin/env bash
#
# Compare Outputs Script
#
# Compares generated outputs between the original OpenAPI Generator (Java)
# and this TypeScript port to identify discrepancies.
#
# Usage:
#   ./scripts/compare-outputs.sh [options]
#
# Options:
#   -g, --generator <name>   Compare specific generator only
#   -v, --verbose           Show detailed diff output
#   -h, --help              Show this help message
#

set -euo pipefail

# Configuration
GENERATORS="typescript-fetch python go php"
ORIGINAL_DIR="tmp/original-output"
PORT_DIR="samples/build"
REPORT_DIR="tmp/comparison-reports"

# Script directory and package root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

# Default options
SELECTED_GENERATOR=""
VERBOSE=false

show_help() {
  cat << EOF
Compare Outputs Script - Compare original vs TS port outputs

Usage:
  ./scripts/compare-outputs.sh [options]

Options:
  -g, --generator <name>  Compare specific generator only
                          Available: typescript-fetch, python, go, php
  -v, --verbose          Show detailed diff output
  -h, --help             Show this help message

Examples:
  ./scripts/compare-outputs.sh                    # Compare all generators
  ./scripts/compare-outputs.sh -g typescript-fetch # Compare specific generator
  ./scripts/compare-outputs.sh -v                 # Verbose output
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -g|--generator)
      SELECTED_GENERATOR="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
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

# If specific generator selected, use it; otherwise use all
if [[ -n "$SELECTED_GENERATOR" ]]; then
  GENERATORS="$SELECTED_GENERATOR"
fi

# Validate directories exist
if [[ ! -d "$ORIGINAL_DIR" ]]; then
  echo "Error: Original output directory not found: $ORIGINAL_DIR"
  echo "Please generate reference outputs first."
  exit 1
fi

if [[ ! -d "$PORT_DIR" ]]; then
  echo "Error: Port output directory not found: $PORT_DIR"
  echo "Please build and generate port outputs first."
  exit 1
fi

# Create report directory
mkdir -p "$REPORT_DIR"

echo "Output Comparison"
echo "================"
echo "Original: $ORIGINAL_DIR"
echo "Port:     $PORT_DIR"
echo "Reports:  $REPORT_DIR"
echo ""

# Summary counters
total_gens=0
identical_gens=0
different_gens=0

# Compare each generator
for gen in $GENERATORS; do
  ((total_gens++)) || true
  
  original_path="$ORIGINAL_DIR/$gen"
  port_path="$PORT_DIR/$gen"
  report_file="$REPORT_DIR/$gen.diff"
  summary_file="$REPORT_DIR/$gen-summary.txt"
  
  echo "Comparing $gen..."
  
  # Check if directories exist
  if [[ ! -d "$original_path" ]]; then
    echo "  ⚠️  Original output not found"
    continue
  fi
  
  if [[ ! -d "$port_path" ]]; then
    echo "  ⚠️  Port output not found"
    continue
  fi
  
  # Perform diff (ignore .openapi-generator metadata files)
  diff -r -u \
    --exclude=".openapi-generator" \
    --exclude=".openapi-generator-ignore" \
    "$original_path" \
    "$port_path" \
    > "$report_file" 2>&1 || true
  
  # Analyze results
  if [[ ! -s "$report_file" ]]; then
    echo "  ✅ No differences!"
    rm "$report_file"
    echo "No differences found" > "$summary_file"
    ((identical_gens++)) || true
  else
    ((different_gens++)) || true
    
    # Count statistics
    diff_lines=$(wc -l < "$report_file")
    files_differ=$(grep -c "^diff -r -u" "$report_file" || true)
    added_lines=$(grep -c "^+" "$report_file" | tail -1 || echo "0")
    removed_lines=$(grep -c "^-" "$report_file" | tail -1 || echo "0")
    
    echo "  ❌ Found differences:"
    echo "     Files differ: $files_differ"
    echo "     Total diff lines: $diff_lines"
    echo "     Report: $report_file"
    
    # Create summary
    {
      echo "Generator: $gen"
      echo "Status: DIFFERENCES FOUND"
      echo ""
      echo "Statistics:"
      echo "  Files with differences: $files_differ"
      echo "  Total diff lines: $diff_lines"
      echo "  Lines added (+): $added_lines"
      echo "  Lines removed (-): $removed_lines"
      echo ""
      echo "Files that differ:"
      grep "^diff -r -u" "$report_file" | sed 's/^diff -r -u /  /' || true
      echo ""
      echo "Full diff available in: $report_file"
    } > "$summary_file"
    
    # Show verbose output if requested
    if $VERBOSE; then
      echo ""
      echo "  Detailed diff:"
      head -100 "$report_file" | sed 's/^/    /'
      if [[ $diff_lines -gt 100 ]]; then
        echo "    ... ($((diff_lines - 100)) more lines, see $report_file)"
      fi
      echo ""
    fi
  fi
done

# Print summary
echo ""
echo "Summary"
echo "======="
echo "Total generators: $total_gens"
echo "Identical: $identical_gens ✅"
echo "Different: $different_gens ❌"
echo ""

if [[ $different_gens -gt 0 ]]; then
  echo "Review detailed reports in: $REPORT_DIR"
  echo ""
  echo "Quick analysis commands:"
  echo "  # View summary"
  echo "  cat $REPORT_DIR/typescript-fetch-summary.txt"
  echo ""
  echo "  # View full diff"
  echo "  less $REPORT_DIR/typescript-fetch.diff"
  echo ""
  echo "  # Compare specific file"
  echo "  diff -u $ORIGINAL_DIR/typescript-fetch/apis/PetsApi.ts \\"
  echo "          $PORT_DIR/typescript-fetch/apis/PetsApi.ts"
fi

# Exit with error if differences found
if [[ $different_gens -gt 0 ]]; then
  exit 1
fi

exit 0
