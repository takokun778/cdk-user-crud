#!/bin/sh

rm -rf src/out

docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli:latest generate -i /local/api/openapi.yaml -g typescript-fetch -o /local/src/out --additional-properties=supportsES6=true,typescriptThreePlus=true
