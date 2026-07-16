# Makefile for generating sample clients from the sample OpenAPI specs

SPEC_FILE := petstore.yaml
UNION_SPEC := union.yaml
BUILD_DIR := build
EXPECTED_DIR := expected
ROOT_DIR := $(shell cd .. && pwd)
CLI := npx tsx $(ROOT_DIR)/src/cli/index.ts

.PHONY: all clean typescript-fetch python go php union check approve

all: typescript-fetch python go php union check

clean:
	rm -rf $(BUILD_DIR)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

typescript-fetch: $(BUILD_DIR)
	@echo "Generating TypeScript Fetch client..."
	$(CLI) generate \
		-i $(SPEC_FILE) \
		-g typescript-fetch \
		-o $(BUILD_DIR)/typescript-fetch \
		-p petstore-client

python: $(BUILD_DIR)
	@echo "Generating Python client..."
	$(CLI) generate \
		-i $(SPEC_FILE) \
		-g python \
		-o $(BUILD_DIR)/python \
		-p petstore_client

go: $(BUILD_DIR)
	@echo "Generating Go client..."
	$(CLI) generate \
		-i $(SPEC_FILE) \
		-g go \
		-o $(BUILD_DIR)/go \
		-p petstore

php: $(BUILD_DIR)
	@echo "Generating PHP client..."
	$(CLI) generate \
		-i $(SPEC_FILE) \
		-g php \
		-o $(BUILD_DIR)/php \
		-p PetstoreClient

# The union spec covers discriminated oneOf and date generation, which the
# petstore spec does not exercise at all.
union: $(BUILD_DIR)
	@echo "Generating union clients..."
	$(CLI) generate \
		-i $(UNION_SPEC) \
		-g typescript-fetch \
		-o $(BUILD_DIR)/union/typescript-fetch \
		-p attribute-client
	$(CLI) generate \
		-i $(UNION_SPEC) \
		-g python \
		-o $(BUILD_DIR)/union/python \
		-p attribute_client
	$(CLI) generate \
		-i $(UNION_SPEC) \
		-g go \
		-o $(BUILD_DIR)/union/go \
		-p attribute
	$(CLI) generate \
		-i $(UNION_SPEC) \
		-g php \
		-o $(BUILD_DIR)/union/php \
		-p AttributeClient

# Golden check. Models carry the union and date output this repo generates;
# the surrounding scaffolding does not, and READMEs embed a build timestamp.
check: union
	@echo "Checking generated union models against expected output..."
	diff -r $(EXPECTED_DIR)/union/typescript-fetch/models \
		$(BUILD_DIR)/union/typescript-fetch/models

# Adopt the current output as expected, after reviewing the diff from `check`.
approve: union
	@echo "Updating expected union models..."
	rm -rf $(EXPECTED_DIR)/union/typescript-fetch/models
	mkdir -p $(EXPECTED_DIR)/union/typescript-fetch
	cp -r $(BUILD_DIR)/union/typescript-fetch/models \
		$(EXPECTED_DIR)/union/typescript-fetch/models
