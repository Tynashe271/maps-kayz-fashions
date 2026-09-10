# Polyglot services monorepo

A runnable local stack containing four independently deployable services:

| Service | Runtime | Port | Purpose |
| --- | --- | --- | --- |
| `express-api` | Node.js / Express | 3001 | Lightweight edge API |
| `spring-api` | Java 21 / Spring Boot | 8080 | JVM API with Actuator |
| `python-api` | FastAPI / SQLAlchemy | 8000 | PostgreSQL-backed CRUD API |
| `sidekiq-worker` | Ruby / Sidekiq | none | Redis-backed jobs |
| `go-api` | Go standard library | 8081 | Lightweight compiled HTTP API |
| `commerce-api` | NestJS / TypeScript | 3000 | Main commerce and cart API |

The pre-existing NestJS application at the repository root is preserved as-is.

## Start

Podman and the Python `podman-compose` package are the prerequisites. Install
the provider with `python -m pip install --user podman-compose`. On Windows or
macOS, initialize and start the Podman virtual machine first:

```sh
podman machine init
podman machine start
python -m podman_compose up --build
```

Try the services:

```sh
curl http://localhost:3001/health
curl http://localhost:8080/actuator/health
curl http://localhost:8000/health
curl http://localhost:8081/health
curl http://localhost:3000/api/health
curl -X POST http://localhost:8000/items -H "Content-Type: application/json" -d '{"name":"first item"}'
curl http://localhost:8000/items
```

## GraphQL gateway

The Express service exposes GraphQL at `http://localhost:3001/graphql`. It
aggregates health information from the services and proxies item operations to
the Python/SQLAlchemy service.

```graphql
query {
  health { service status }
  items { id name }
}

mutation {
  createItem(name: "first item") { id name }
}
```

Stop with `python -m podman_compose down`. Add `-v` only when you intend to delete the
PostgreSQL volume too.

## Run directly

- Express: `cd services/express-api && npm install && npm test && npm start`
- Spring: `cd services/spring-api && mvn test && mvn spring-boot:run`
- Python: install `requirements-dev.txt`, run `pytest`, then run `uvicorn app.main:app --reload`
  from `services/python-api`.
- Sidekiq: run Redis, use `bundle install`, then
  `bundle exec sidekiq -r ./config/boot.rb -C config/sidekiq.yml`.
  Enqueue a sample with `bundle exec ruby bin/enqueue "hello"`.

Python defaults to SQLite outside the container stack and PostgreSQL inside
Compose. Sidekiq defaults to Redis on localhost outside the container stack.

## Requirements coverage

The NestJS API exposes native workflows for authentication, products,
categories, customers, orders, inventory, deliveries, returns, promotions,
administration and WhatsApp. The remaining business domains in the advanced
system requirements are available through the validated record API at
`/api/platform/:resource`; discover the complete list at
`GET /api/platform/capabilities`.

Payment processing is intentionally excluded. There are no payment-provider,
payment-attempt, webhook-verification, reconciliation or refund-service routes.
Order lifecycle labels are retained so a payment service can be integrated
later without migrating historical orders.

## Cart ordering through WhatsApp

Set `WHATSAPP_ORDER_NUMBER` in `.env` to the shop's international number using
digits only (for example `263771234567`). Customers can then create a cart, add
catalogue products and request a prefilled WhatsApp order link:

1. `POST /api/carts`
2. `POST /api/carts/:cartId/items`
3. `GET /api/carts/:cartId`
4. `POST /api/carts/:cartId/whatsapp`

The last response contains `whatsappUrl`; opening it sends the customer to
WhatsApp with product names, SKUs, options, quantities, total and cart reference
already filled in. When the shop number is not configured, WhatsApp asks the
customer to choose the recipient. No payment service is involved.
