# Makefile for generating sample clients from Petstore OpenAPI spec

SPEC_FILE := petstore.yaml
BUILD_DIR := build
ROOT_DIR := $(shell cd .. && pwd)
CLI := npx tsx $(ROOT_DIR)/src/cli/index.ts

.PHONY: all clean typescript-fetch python go php

all: typescript-fetch python go php

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
