import express from 'express';
import { DataSource, In } from 'typeorm';
import { Server } from 'socket.io';
import http from 'http';
import https from 'https';
import { initRoutes } from './http/route.js';
import { Config } from './config.js';
import { Setting } from './types/Setting.js';
import JwtHelper from './jwt.js';
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';

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

await db.initialize();

let [priKey, pubKey] = await Promise.all([
    db.manager.findOneBy(Setting, { key: 'jwt.private' }),
    db.manager.findOneBy(Setting, { key: 'jwt.public' })
]);

if (!priKey || !pubKey) {
    const keyPair = JwtHelper.generateKeys();
    priKey = new Setting('jwt.private', keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString());
    pubKey = new Setting('jwt.public', keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' }).toString());

    await db.manager.transaction(async manager => {
        await manager.delete(Setting, {
            key: In(['jwt.private', 'jwt.public'])
        });
        await manager.save([priKey, pubKey]);
    });
}

const jwt = new JwtHelper(
    createPrivateKey(priKey.value),
    createPublicKey(pubKey.value)
);

initRoutes(app, io, db, jwt);

server.listen(Config.instance.server.port, Config.instance.server.host, () => {
    console.log(`Server running at http${Config.instance.server.ssl.enabled ? 's' : ''}://${Config.instance.server.host}:${Config.instance.server.port}`);
});