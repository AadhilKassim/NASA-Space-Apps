# AIM Server

## Setup

1. Copy `.env.example` to `.env` and set your NASA API key.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start MongoDB (locally or with Docker Compose).
4. Start the server:
   ```sh
   npm run dev
   ```

## Endpoints
- `/api/asteroids` — NASA NeoWs proxy (cached)
- `/api/sentry/:id` — JPL Sentry/NeoWs details
- `/api/impact/simulate` — Impact/tsunami simulation
