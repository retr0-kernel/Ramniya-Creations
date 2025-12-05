.PHONY: dev down clean logs backend-logs frontend-logs

dev:
	docker compose -f docker-compose.dev.yml up --build

down:
	docker compose -f docker-compose.dev.yml down

clean:
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -f

logs:
	docker compose -f docker-compose.dev.yml logs -f

backend-logs:
	docker compose -f docker-compose.dev.yml logs -f backend

frontend-logs:
	docker compose -f docker-compose.dev.yml logs -f frontend