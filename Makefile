.PHONY: help setup dev dev-mock build lint test-e2e test-e2e-ui clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Install dependencies and Playwright browsers
	npm install
	npx playwright install chromium

dev: ## Start dev server (real Supabase)
	npm run dev

dev-mock: ## Start dev server with mock Supabase (no real backend needed)
	npm run dev:mock

build: ## Production build (static export)
	npm run build

lint: ## Run ESLint
	npm run lint

test-e2e: ## Run Playwright E2E tests
	npm run test:e2e

test-e2e-ui: ## Run Playwright E2E tests with interactive UI
	npm run test:e2e:ui

clean: ## Remove build artefacts and test reports
	rm -rf .next out playwright-report test-results
