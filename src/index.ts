import { DataSource, In } from 'typeorm';
import { Server } from 'socket.io';
import http from 'http';
import https from 'https';
import { initRoutes } from './http/route.js';
import { Config } from './config.js';
import { Setting } from './types/Setting.js';
import JwtHelper from './jwt.js';
import { createPrivateKey, createPublicKey } from 'crypto';
import { UserInfo } from './types/UserInfo.js';
import { ServerConfig } from './http/server-config.js';
import { NonceGenerator } from './nonce.js';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFile } from 'fs/promises';

const app = new Hono();

// 初始化服务器
const serveOptions = {
    fetch: app.fetch,
    port: Config.instance.server.port,
    hostname: Config.instance.server.host
};
let server;
// 是否启用 SSL
if (Config.instance.server.ssl.enabled) {
    server = serve({
        ...serveOptions,
        createServer: https.createServer,
        serverOptions: {
            key: await readFile(Config.instance.server.ssl.key),
            cert: await readFile(Config.instance.server.ssl.cert)
        }
    });
} else {
    server = serve({
        ...serveOptions,
        createServer: http.createServer,
    });
}
console.log(`Server running at http${Config.instance.server.ssl.enabled ? 's' : ''}://${Config.instance.server.host || '0.0.0.0'}:${Config.instance.server.port}`);

// Socket.IO
const io = new Server(server);
// 数据库
const db = new DataSource({
    type: Config.instance.database.type as any,
    host: Config.instance.database.host,
    port: Config.instance.database.port,
    username: Config.instance.database.username,
    password: Config.instance.database.password,
    database: Config.instance.database.database,
    entities: [Setting, UserInfo],
    synchronize: Config.instance.database.synchronize
});

await db.initialize();

// 读取 JWT 密钥，没有就生成然后写入
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

// 一堆奇怪的数据
const config: ServerConfig = {
    hono: app,
    database: db,
    jwt: jwt,
    io: io,
    nonce_generators: {
        deletion: new NonceGenerator<{ userId: number }>()
    }
};

initRoutes(config);