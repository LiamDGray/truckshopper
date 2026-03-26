// ==UserScript==
// @name         Catalog Relay Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Relays catalog queries to the proxy server
// @author       Gemini CLI
// @match        http://localhost:4000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Connected to Relay Proxy');
    };

    ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        console.log('Received query:', msg);

        if (msg.action === 'query') {
            const results = await performSearch(msg.query.part);
            ws.send(JSON.stringify({
                id: msg.id,
                data: results
            }));
        }
    };

    async function performSearch(queryText) {
        // If we are on the search page
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        if (searchInput && searchButton) {
            searchInput.value = queryText;
            searchButton.click();
            
            // Wait for results to load (simulated by page reload)
            // In a real SPA we might wait for a DOM element
            return new Promise((resolve) => {
                // For this mock, we'll just wait a bit and scrape if we're on the results page
                // But since click() reloads the page, this script will restart.
                // We need a way to persist the request ID or handle the page reload.
                
                // IDEA: The proxy server should handle the "waiting" if the page reloads.
                // But the userscript restarts on reload.
                
                // SIMPLER VERSION for Mock: Use fetch() to get the results instead of clicking.
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
