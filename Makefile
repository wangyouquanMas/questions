.PHONY: start-db stop-db run-backend run-frontend build-backend test-backend clean

# Start MySQL and Redis using Docker Compose
start-db:
	docker-compose up -d mysql redis

# Stop and remove containers, networks, and volumes
stop-db:
	docker-compose down

# Run the backend Go application
run-backend:
	cd backend && ./run.sh

# Run the frontend React application
run-frontend:
	cd frontend && npm run dev

# Build the backend application
build-backend:
	cd backend && go build -o bin/questions_backend ./cmd/main.go

# Run tests for the backend
test-backend:
	cd backend && go test ./...

# Clean compiled binaries
clean:
	rm -rf backend/bin

# Start the full development environment (backend + frontend + DB)
dev: start-db
	$(MAKE) -j 2 run-backend run-frontend

# Help command
help:
	@echo "Available commands:"
	@echo "  make start-db          - Start MySQL and Redis using Docker Compose"
	@echo "  make stop-db           - Stop and remove containers, networks, and volumes"
	@echo "  make run-backend       - Run the backend Go application"
	@echo "  make run-frontend      - Run the frontend React application"
	@echo "  make build-backend     - Build the backend application"
	@echo "  make test-backend      - Run tests for the backend"
	@echo "  make clean             - Clean compiled binaries"
	@echo "  make dev               - Start the full development environment"
	@echo "  make help              - Show this help message"

# Default target
default: help 