# Catalog Scraper Instructions

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Mock Catalog Server**:
   ```bash
   npm run mock
   ```
   *This server simulates the real catalog at `http://localhost:4000`.*

3. **Start the Relay Proxy Server**:
   ```bash
   npm run proxy
   ```
   *This server acts as a bridge between the agent and your browser at `http://localhost:3000`.*

4. **Install the Userscript**:
   - Install a userscript manager like **Tampermonkey**.
   - Create a new userscript and paste the contents of `userscript.js`.
   - Ensure it is active for `http://localhost:4000/*`.

## Usage
1. Open your browser and go to `http://localhost:4000`.
2. Solve the CAPTCHA (Enter "4").
3. You should see "Connected to Relay Proxy" in your browser's console.
4. From another terminal or as an agent query, you can now search the catalog:
   ```bash
   curl "http://localhost:3000/query?part=22R+water+pump"
   ```

## Testing
Run the proxy relay tests:
```bash
npm test
```
