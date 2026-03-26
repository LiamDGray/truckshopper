# TruckShopper Instructions

TruckShopper helps you find parts for your 1986 Toyota 4Runner (RN66L-MDA3, 22R engine) by bridging your browser session to an agent and comparing prices between aftermarket (AutoZone) and OEM (Amayama).

## Features
- **CAPTCHA Relay**: Scrape catalogs that require human login or CAPTCHA solving.
- **Cart Interception**: Automatically save your Amayama cart data for comparison.
- **Price Comparison**: Analyze AutoZone credit ($108) and discounts (20% off >$100).

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Mock Catalog Server** (Optional, for testing):
   ```bash
   npm run mock
   ```

3. **Start the Relay Proxy Server**:
   ```bash
   npm run proxy
   ```

4. **Install the Userscript**:
   - Install **Tampermonkey** in your browser.
   - Create a new userscript and paste `userscript.js`.
   - The script works on `http://localhost:4000/*` and `https://www.amayama.com/*`.

## Usage

### 1. Intercepting Cart Data
- Start the proxy (`npm run proxy`).
- Log into **Amayama** and navigate to your **Cart**.
- The proxy will log `Saved snapshot: amayama_...json`.

### 2. Comparing Prices
- Edit `compare-prices.ts` if your AutoZone cart has changed.
- Run the analysis:
  ```bash
  npx ts-node compare-prices.ts
  ```

### 3. Adding New Sites
- In your browser, click the Tampermonkey icon.
- Select **Add Interceptor URL**.
- Provide the site name, URL regex, and parser name.

## Development & Testing

- **Tests**: `npm test` runs the proxy relay and data sink tests.
- **Git**: Branch for features (`feature/...`), test, and merge to `master`.

## Current Strategy Logic
The system prioritizes your **$108 AutoZone credit**.
- Orders > $100 get 20% off.
- The credit is applied *after* the discount.
- If AutoZone out-of-pocket is > 0, the script suggests checking Amayama OEM prices.
