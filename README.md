# ws-broadcaster

Broadcasts received messages to connected clients.

## Install

`npm install -g ws-broadcaster`

## How it works

It opens a websocket connection on port 8080 (default).
Clients connected to this server can broadcast messages between them.
The client who sends a message doesn't receive it back, it's sent to the other clients only.

## Client IDs

After each clients connects it will get a
[UUID V1](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_1_.28date-time_and_MAC_address.29)
from **websocket-broadcast**.
Useful if you need to identify your clients with a unique ID.

UUID will be sent in a message with type `uuid`, something like this:

`{type: 'uuid', data: 'ed8ef0b0-35ff-11e7-8de4-6bd9049b7aa7'}`

When a client is disconnected a message will be sent as well:

`{type: 'disconnect', message: 'bye'}`

You can disable ID generation by setting the `--noid` modifier:

`ws-broadcaster --noid`

Note that disconnection messages won't be sent when `--noid` is set.

## Customize port

You can set a custom port by using the `-p` param:

`ws-broadcaster -p 8080`

## SSL support

If you need a secure connection (wss) simply pass your credential and key to use them:

`ws-broadcaster --cert /path/to/cert.pem --key path/to/key.pem`

## Logging

By default it will log every received message.

If you want to turn off logging you can use the `--nolog`:

`ws-broadcaster --nolog`
