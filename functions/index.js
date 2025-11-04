const functions = require('firebase-functions');

const spinHandler = require('./src/spin');
const runBattleHandler = require('./src/run-battle');

exports.spin = functions.https.onRequest((req, res) => {
  spinHandler(req, res);
});

exports.runBattle = functions.https.onRequest((req, res) => {
  runBattleHandler(req, res);
});
