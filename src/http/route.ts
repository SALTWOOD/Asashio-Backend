import express from 'express';
import { Server } from'socket.io';
import { DataSource } from 'typeorm';
import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';

export function initRoutes(app: express.Application, io: Server, db: DataSource) {
    app.get('/.well-known/openid-configuration', (req, res) => {
        res.json(getOidcOptions(Config.instance.server.baseUrl));
    });
}