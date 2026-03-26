// ==UserScript==
// @name         Catalog Relay Userscript
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Relays catalog queries and intercepts cart JSON to the proxy server
// @author       Gemini CLI
// @match        http://localhost:4000/*
// @match        https://www.amayama.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const ws = new WebSocket('ws://localhost:3000');

    // Default site configurations
    const DEFAULT_CONFIGS = [
        {
            name: 'amayama',
            urlPattern: 'amayama\\.com/en/cart/quantity',
            parser: 'amayama'
        }
    ];

    let siteConfigs = GM_getValue('siteConfigs', DEFAULT_CONFIGS);

    GM_registerMenuCommand("Add Interceptor URL", () => {
        const name = prompt("Site Name (e.g. Amayama):");
        const pattern = prompt("URL Pattern (Regex):");
        const parser = prompt("Parser Name (e.g. amayama):");
        if (name && pattern && parser) {
            siteConfigs.push({ name, urlPattern: pattern, parser });
            GM_setValue('siteConfigs', siteConfigs);
            alert(`Added interceptor for ${name}`);
        }
    });

    const parsers = {
        amayama: (json) => {
            if (!json.data || !json.data.items) return null;
            return Object.values(json.data.items).map(item => ({
                id: item.goodPriceId,
                name: item.notes || "Unknown Item", // Amayama doesn't always have names in the JSON items list
                price: parseFloat(item.totalPrice),
                priceUSD: item.priceUSD,
                qty: item.quantity,
                warehouse: item.warehouseName,
                totalWeight: parseFloat(item.totalWeight)
            }));
        }
    };

    ws.onopen = () => console.log('Connected to Relay Proxy');

    ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.action === 'query') {
            const results = await performSearch(msg.query.part);
            ws.send(JSON.stringify({ id: msg.id, data: results }));
        }
    };

    // Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = args[0] instanceof Request ? args[0].url : args[0];

        const config = siteConfigs.find(c => new RegExp(c.urlPattern).test(url));
        if (config && parsers[config.parser]) {
            const clone = response.clone();
            clone.json().then(data => {
                const parsed = parsers[config.parser](data);
                if (parsed) {
                    ws.send(JSON.stringify({
                        type: 'INTERCEPTED_DATA',
                        site: config.name,
                        data: parsed,
                        timestamp: new Date().toISOString()
                    }));
                }
            }).catch(e => console.error('Failed to parse intercepted JSON', e));
        }
        return response;
    };

    // Helper for manual queries
    async function performSearch(queryText) {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        if (searchInput && searchButton) {
            searchInput.value = queryText;
            searchButton.click();
            return new Promise((resolve) => {
                fetch(`/search?q=${encodeURIComponent(queryText)}`)
                    .then(res => res.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const partItems = doc.querySelectorAll('.part-item');
                        const results = Array.from(partItems).map(item => ({
                            name: item.querySelector('.part-name').innerText,
                            number: item.querySelector('.part-number').innerText,
                            price: item.querySelector('.price').innerText
                        }));
                        resolve(results);
                    });
            });
        } else {
            return { error: 'Not on search page or CAPTCHA required' };
        }
    }
})();
