.PHONY: start stop logs reset

start:
	docker-compose up --build

stop:
	docker-compose down

logs:
	docker-compose logs -f

reset:
	docker-compose down -v
