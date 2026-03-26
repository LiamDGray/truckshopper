# Catalog Scraper Architecture

This system allows a remote agent (like Gemini CLI) to scrape a catalog that is behind a CAPTCHA by relaying queries through a user's logged-in browser session.

## Components

### 1. Mock Catalog Server (`mock-catalog/`)
- A simple Express server.
- Serves a page with a simulated CAPTCHA.
- Provides a search interface that returns parts data.
- **Purpose**: To provide a target for TDD and development without hitting the real catalog.

### 2. Relay Proxy Server (`proxy-server/`)
- A TypeScript Node.js application.
- **HTTP Server**: Receives search requests from the agent.
- **WebSocket Server**: Maintains a persistent connection with the Userscript.
- **Relay Logic**:
  1. Receives an HTTP request (e.g., `GET /search?q=water+pump`).
  2. Generates a unique ID for the request.
  3. Sends the query to the connected Userscript via WebSocket.
  4. Waits for the Userscript to respond.
  5. Returns the response to the HTTP client.

### 3. Userscript (`userscript/`)
- A JavaScript file intended for use with Tampermonkey/Greasemonkey.
- Runs on the catalog website (and the mock catalog).
- **Functionality**:
  1. Connects to `ws://localhost:3000/relay`.
  2. Listens for query events.
  3. Executes queries in the browser (e.g., filling search fields, clicking buttons, scraping results).
  4. Sends the extracted data back to the Proxy Server.

## Communication Flow

1. **Agent** -> `POST /query { "part": "22R water pump" }` -> **Proxy Server**
2. **Proxy Server** -> `WS { "id": "123", "action": "search", "query": "22R water pump" }` -> **Userscript**
3. **Userscript** (in Browser) -> Interacts with Catalog DOM -> Scrapes Data
4. **Userscript** -> `WS { "id": "123", "data": [...] }` -> **Proxy Server**
5. **Proxy Server** -> HTTP Response -> **Agent**

## Development & TDD Plan

1. **Setup**: Initialize TypeScript project and dependencies (`express`, `ws`, `vitest`).
2. **Mock Server**: Build the mock catalog page and captcha.
3. **Proxy Core**: Implement the WebSocket-to-HTTP relay with TDD.
4. **Userscript**: Implement the listener and scraping logic.
5. **Integration**: Run the end-to-end flow.
