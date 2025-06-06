import express from 'express';
import { Server } from 'socket.io';
import { DataSource } from 'typeorm';
import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';
import { Request, Response, NextFunction } from 'express';

export function initRoutes(app: express.Application, io: Server, db: DataSource) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
        res.json(getOidcOptions(Config.instance.server.baseUrl));
    });
}