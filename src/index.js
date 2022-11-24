#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const uuid = require('uuid/v1');
const chalk = require('chalk');
const clear = require('clear');
const cursor = require('cli-cursor');
const args = require('minimist')(process.argv.slice(2));
const port = process.env.PORT || args.port || args.p || 8080;
const verbose = !args.nolog;
const identify = !args.noid;
const { cert } = args;
const { key } = args;
let wss;

clear();
cursor.hide();

// Create websocket server.
if (cert && key) {
  // SSL.
  log(chalk.yellow('🔐 Using SSL'));
  const server = https.createServer({
    cert: fs.readFileSync(cert),
    key: fs.readFileSync(key)
  });

  wss = new WebSocket.Server({ server });
  server.listen(port, onListening);
} else {
  // Non SSL.
  wss = new WebSocket.Server({ port }, onListening);
}

// Will map clients to channels based on the URL path.
const channels = {}

wss.on('connection', (ws, req) => {
  log(`Total clients: ${chalk.white(wss.clients.size)}, url: ${req.url}`);
  const { host } = req.headers;
  const channelId = req.url.substring(1);
  log(`CHANNEL: ${chalk.white(channelId)}`);

  // Add client to channel.
  channels[channelId] = channels[channelId] || [];
  channels[channelId].push(ws);

  if (identify) {
    const id = uuid();
    if (verbose) log(`NEW client: ID: ${chalk.white(id)} @${chalk.blue(host)}`);

    // Send UUID to client.
    send(ws, { type: 'uuid', data: id });

    ws.on('close', (ws) => {
      if (verbose) log(`Client ${id} DISCONNECTED`);
      const message = JSON.stringify({
        type: 'disconnect',
        message: 'bye'
      });
      broadcast({ ws, channelId, message });
    });
  }

  ws.on('message', (message) => {
    if (verbose) log(`MSG from ${host}`, chalk.gray(message));
    broadcast({ ws, channelId, message });
  });

  ws.on('error', (err) => {
    log(chalk.red('ERROR:'), err);
  });
});

function onListening() {
  const noidMsg = identify ? '' : ` --${chalk.white('noid')}`;
  const nologMsg = verbose ? '' : ` --${chalk.white('nolog')}`;
  console.log(
    chalk.yellow(`LISTENING on PORT ${chalk.white(port)}${noidMsg}${nologMsg}`)
  )
}

function broadcast({ ws, channelId, message }) {
  if (!channels[channelId]) {
    log(`Channel ${channelId} does not exist!`);
    return;
  }

  if (!channels[channelId].length) {
    log(`Removed empty channel: ${channelId}`);
    delete channels[channelId];
    return;
  }
  // remove closed connections
  channels[channelId] = channels[channelId]
    .filter((client) => client.readyState === WebSocket.OPEN);

  channels[channelId].map((client) => {
    if (client === ws) {
      log(`Same client of: ${channelId}`);
      return;
    } // Skipping message sender.
    if (client.readyState !== WebSocket.OPEN) {
      log(`client state is closed.`);
      return;
    }
    log(`client message sent.`);
    client.send(message, (error) => {}); // eslint-disable-line
  });
}

function send(ws, message) {
  const data = JSON.stringify(message);
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(data, (error) => {}); // eslint-disable-line
}

function log() {
  // Single line basic info.
  if (!verbose) {
    const message = Array.prototype.join.call(arguments, ' ');
    try {
      process.stdout.clearLine();
    } catch (e) {}
    process.stdout.write(`\r${message}\r`);
    return;
  }

  const ts = new Date().toISOString();
  console.log(`${chalk.dim(ts)}:`, ...arguments);
}

module.exports = {
  onListening,
  broadcast,
  send
}
