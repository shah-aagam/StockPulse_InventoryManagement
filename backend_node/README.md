# StockPulse Node.js backend

This is a separate replacement backend. The existing Spring Boot project and React frontend remain unchanged. It preserves the frontend's `http://localhost:8080` REST API and JSON fields, stores data in MongoDB, and sends inventory recommendation jobs through durable RabbitMQ queues.

The backend uses native Node.js ES modules (`import`/`export`).

## Requirements

- Node.js 20 or newer
- npm
- Docker Desktop (for local MongoDB and RabbitMQ), or reachable MongoDB/RabbitMQ instances

## Configure and run

1. Review `.env` and update `MONGODB_URI` and `RABBITMQ_URL`. Set `LLM_PROVIDER=groq` or `LLM_PROVIDER=gemini`, then add the corresponding `GROQ_API_KEY` or `GEMINI_API_KEY`. Model names are configurable with `GROQ_MODEL` and `GEMINI_MODEL`. The rule advisor works without an AI key; selecting the AI strategy falls back to rules if the provider request fails or its key is missing.
2. Start local dependencies from this directory: `docker compose up -d`.
3. Install packages: `npm install`.
4. Start the API in one terminal: `npm start`.
5. Start recommendation workers in another terminal: `npm run worker`.

The API listens on port `8080`, matching the current frontend. The first API startup seeds the eight demo products if the MongoDB database is empty. Set `SEED_DEMO_DATA=false` to disable that behavior. RabbitMQ's management page is available at `http://localhost:15672` (default local credentials: `guest` / `guest`).

## Source layout

```text
src/
  app.js                 Express app and middleware
  server.js              Database connection and API startup
  config/                Environment configuration
  controllers/           Request handlers
  models/                Mongoose models and schemas
  routes/                Express route definitions
  services/              Inventory, recommendation, and queue logic
  utils/                 Shared middleware and demo seeding
  workers/               RabbitMQ background consumers
```

## API compatibility

- `GET/POST /products`
- `PATCH /products/:id/stock`
- `POST /products/:id/orders`
- `POST /products/:id/suggest-pricing`
- `POST /products/:id/suggest-reorder`
- `GET /pricing-suggestions`
- `GET /reorder-suggestions`
- `PATCH /pricing-suggestions/:id`
- `PATCH /reorder-suggestions/:id`
- `GET/PUT /strategy`

Manual suggestion requests return the created suggestion immediately. Inventory changes enqueue durable pricing and reorder jobs; the worker persists `PENDING` suggestions for approval. RabbitMQ queues are `stockpulse.pricing` and `stockpulse.reorder`.

## Data and behavior

MongoDB collections hold products, pricing suggestions, reorder suggestions, and the selected advisor strategy. IDs, enums, request fields, response fields, filtering, approval behavior, and the rule-based recommendation formula follow the Spring backend. The AI advisor supports Groq Chat Completions and Gemini `generateContent`; both outputs are normalized and validated against price bounds, direction, quantity, confidence, and reasoning rules. A failed/unconfigured LLM uses the rule advisor.

Groq uses its OpenAI-compatible chat completions endpoint. Gemini uses the REST `generateContent` endpoint with JSON response mode. Free-tier model availability and request limits depend on the provider and can change; check the providers' current model and pricing pages before choosing a model: [Groq models](https://console.groq.com/docs/models), [Gemini models](https://ai.google.dev/gemini-api/docs/models), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

The queue uses durable queues and persistent messages. Run the API and worker together; if RabbitMQ is unavailable, an inventory update is saved but its API request reports the enqueue failure, so inspect/retry that update after RabbitMQ is restored.
