import express from 'express';

const app = express();
const port = 4000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Mock Catalog</title></head>
      <body>
        <h1>Toyota Parts Catalog</h1>
        <p>Please solve the CAPTCHA to continue.</p>
        <div id="captcha-box" style="border: 1px solid black; padding: 10px; width: 200px;">
          <p>Is 2 + 2 = 4?</p>
          <form action="/solve" method="POST">
            <input type="text" name="answer" placeholder="Your answer">
            <button type="submit">Submit</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

app.post('/solve', (req, res) => {
  if (req.body.answer === '4') {
    res.redirect('/search');
  } else {
    res.send('Incorrect CAPTCHA. <a href="/">Try again</a>');
  }
});

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  let results = '';
  if (q === '22R water pump') {
    results = `
      <div class="part-item">
        <span class="part-name">Water Pump Sub-Assy</span>
        <span class="part-number">16100-39415</span>
        <span class="price">$55.00</span>
      </div>
    `;
  } else {
    results = '<p>No parts found.</p>';
  }

  res.send(`
    <html>
      <head><title>Search Catalog</title></head>
      <body>
        <h1>Search Results</h1>
        <form action="/search" method="GET">
          <input type="text" name="q" value="${q}" id="search-input">
          <button type="submit" id="search-button">Search</button>
        </form>
        <div id="results">
          ${results}
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Mock Catalog Server listening at http://localhost:${port}`);
});
