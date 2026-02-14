.PHONY: up down build logs restart status clean ollama migrate admin

# Start all services
up:
	docker compose up -d

# Start with Ollama
ollama:
	docker compose --profile ollama up -d

# Stop all services
down:
	docker compose down

# Build/rebuild containers
build:
	docker compose build

# View logs (follow)
logs:
	docker compose logs -f

# Logs for a specific service
logs-%:
	docker compose logs -f $*

# Restart all services
restart:
	docker compose restart

# Show service status
status:
	docker compose ps

# Clean everything (volumes too)
clean:
	docker compose down -v

# Run JSON-to-MongoDB migration
migrate:
	docker compose exec backend python -m backend.scripts.migrate_json_to_mongo

# Create admin user
admin:
	docker compose exec backend python -m backend.scripts.create_admin

# Quick setup: copy env, build, start
setup:
	@test -f .env || cp .env.example .env
	@echo "Edit .env with your secrets, then run: make up"
