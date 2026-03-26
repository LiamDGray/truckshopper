# TruckShopper: Catalog Scraper & Price Comparison Architecture

This system allows a remote agent (like Gemini CLI) to scrape catalogs behind CAPTCHAs and compare prices across sites (e.g., AutoZone vs. Amayama) by relaying through a user's browser session.

## Components

### 1. Mock Catalog Server (`mock-server.ts`)
- Simulates a catalog with a CAPTCHA and search results.
- **Port**: 4000
- **Purpose**: Target for development and TDD.

### 2. Relay Proxy Server (`proxy.ts`, `proxy-core.ts`)
- **HTTP/WS Bridge**: Port 3000.
- **Relay Logic**: Receives HTTP queries, assigns IDs, and sends them to the browser via WebSocket.
- **Data Sink**: Intercepts JSON data pushed from the browser (e.g., shopping carts) and saves them as snapshots in `snapshots/`.

### 3. Userscript (`userscript.js`)
- Runs in the user's browser (e.g., via Tampermonkey).
- **Relay**: Listens for queries from the proxy and executes them in the browser session.
- **Interception**: Monkey-patches `fetch` to capture JSON responses from retail carts (like Amayama).
- **UI Menu**: Allows users to add new URL patterns for interception dynamically.

### 4. Comparison Engine (`compare-prices.ts`)
- Analyzes saved snapshots from various sites.
- **AutoZone Logic**: Applies a 20% discount on orders >$100 and then subtracts a $108 credit.
- **Strategy Advice**: Recommends which parts to buy at which store to minimize out-of-pocket costs.

## Communication Flows

### A. Active Query (Agent-Driven)
1. **Agent** -> `HTTP GET /query?part=...` -> **Proxy Server**
2. **Proxy Server** -> `WS { action: 'query', ... }` -> **Userscript**
3. **Userscript** -> Browser DOM / `fetch()` -> Scrapes Data
4. **Userscript** -> `WS { id: ..., data: [...] }` -> **Proxy Server**
5. **Proxy Server** -> `HTTP Response` -> **Agent**

### B. Passive Interception (User Browsing)
1. **User** -> Navigates to `amayama.com/en/cart`
2. **Userscript** -> Intercepts Cart JSON response via `fetch` patch.
3. **Userscript** -> `WS { type: 'INTERCEPTED_DATA', ... }` -> **Proxy Server**
4. **Proxy Server** -> Saves to `snapshots/amayama_TIMESTAMP.json`

## Target Vehicle Info
- **Model**: 1986 Toyota 4Runner (RN66L-MDA3)
- **Engine**: 22R
- **Goal**: Compare aftermarket prices (AutoZone) with OEM (Amayama Japan).
