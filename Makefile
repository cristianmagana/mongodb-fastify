.PHONY: lint format build run-local test test-file test-watch

lint:
	npx gts lint src/ tests/

format:
	npx gts fix src/ tests/

build:
	npm run build

run-local:
	MONGODB_URI=mongodb://localhost:27017/mydb node dist/src/index.js

test:
	npm run ci-test

test-file:
	@test -n "$(FILE)" || (echo "Usage: make test-file FILE=tests/routes/collectionRoutes.test.ts" && exit 1)
	npx jest $(FILE)

test-watch:
	npx jest --watch
