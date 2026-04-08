# Idempotency Demo

A demonstration of idempotency in HTTP requests using Node.js and Express. This project shows how to handle duplicate requests gracefully by using the `Idempotency-Key` header.

## What is Idempotency?

Idempotency is a property of operations that produce the same result regardless of how many times they are executed. In the context of APIs, it ensures that making the same request multiple times has the same effect as making it once—preventing accidental duplicate operations (e.g., duplicate orders, duplicate payments, duplicate transactions).

## How It Works

This server implements idempotency by:

1. **Requiring an `Idempotency-Key` header** on POST requests to `/orders`
2. **Storing the response** of each request using the idempotency key as the cache key
3. **Replaying cached responses** if the same idempotency key is used again instead of re-processing the request
4. **Managing state in memory** with two maps:
   - `idempotencyStore`: Stores cached responses keyed by idempotency key
   - `orders`: Stores created orders keyed by order ID

## Prerequisites

- Node.js (version 14 or higher)
- npm

## Installation

1. Navigate to the project directory:
```bash
cd idemptotency
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

Start the server with:
```bash
npm start
```

The server will start running on `http://localhost:3000`

## API Endpoints

### POST `/orders`

Creates a new order. Requires the `Idempotency-Key` header.

**Headers:**
- `Content-Type: application/json` (required)
- `Idempotency-Key: <unique-key>` (required)

**Request Body:**
```json
{
  "item": "string",
  "qty": "number"
}
```

**Response (201 Created):**
```json
{
  "order": {
    "id": "uuid",
    "item": "string",
    "qty": "number",
    "createdAt": "ISO-8601-timestamp"
  },
  "idempotent": "created new idempotent entry" | "replayed"
}
```

## Example Usage

### Creating an Order (First Request)

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: my-unique-key-1" \
  -d '{
    "item": "Laptop",
    "qty": 2
  }'
```

Response:
```json
{
  "order": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "item": "Laptop",
    "qty": 2,
    "createdAt": "2026-04-08T10:30:00.000Z"
  },
  "idempotent": "created new idempotent entry"
}
```

### Replaying the Same Request

Use the same `Idempotency-Key` again:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: my-unique-key-1" \
  -d '{
    "item": "Laptop",
    "qty": 2
  }'
```

Response (returns the cached response):
```json
{
  "order": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "item": "Laptop",
    "qty": 2,
    "createdAt": "2026-04-08T10:30:00.000Z"
  },
  "idempotent": "replayed"
}
```

Notice that:
- The order ID remains the same
- The response includes `"idempotent": "replayed"` indicating this is a cached response
- No new order is created

## Notes

- **In-Memory Storage**: This demo uses in-memory maps for storage. When the server restarts, all data is lost. For production use, implement persistent storage (database).
- **No Cleanup**: The current implementation doesn't clean up old idempotency keys. Consider adding TTL (time-to-live) logic for production systems.
- **Single Server**: This implementation works on a single server instance. For distributed systems, use external caching (Redis, database) to share idempotency state across instances.

## Project Structure

```
.
├── package.json   # Project metadata and dependencies
├── server.js      # Express server implementation
└── README.md      # This file
```
