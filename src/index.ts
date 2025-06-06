import express from 'express';
import { DataSource } from 'typeorm';
import { Server } from 'socket.io';
import http from 'http';
import https from 'https';
import { initRoutes } from './http/route.js';
import { Config } from './config.js';

const app = express();

// Initialize server
let server;
if (Config.instance.server.ssl.enabled) {
    server = https.createServer({
        key: Config.instance.server.ssl.key,
        cert: Config.instance.server.ssl.cert
    }, app);
} else {
    server = http.createServer(app);
}

const io = new Server(server);
const db = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'mysql',
    password: 'mysql',
    database: 'asashio',
    entities: []
});

// await db.initialize();

initRoutes(app, io, db);

server.listen(Config.instance.server.port, Config.instance.server.host, () => {
    console.log(`Server running at http${Config.instance.server.ssl.enabled ? 's' : ''}://${Config.instance.server.host}:${Config.instance.server.port}`);
});