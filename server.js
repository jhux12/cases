const path = require('path');
const express = require('express');

const spinHandler = require('./functions/src/spin');
const runBattleHandler = require('./functions/src/run-battle');
const openVaultHandler = require('./functions/src/open-vault');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

app.options('/api/spin', wrap(spinHandler));
app.post('/api/spin', wrap(spinHandler));

app.options('/api/run-battle', wrap(runBattleHandler));
app.get('/api/run-battle', wrap(runBattleHandler));

app.options('/api/open-vault', wrap(openVaultHandler));
app.post('/api/open-vault', wrap(openVaultHandler));

const staticRoot = path.join(__dirname);
const staticMiddleware = express.static(staticRoot, {
  dotfiles: 'ignore',
  fallthrough: true,
  index: false
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return staticMiddleware(req, res, next);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(staticRoot, 'index.html'));
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
