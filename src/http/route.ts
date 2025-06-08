import express from 'express';
import { Server } from 'socket.io';
import { DataSource } from 'typeorm';
import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';
import { Request, Response, NextFunction } from 'express';
import { UserInfo } from '../types/UserInfo.js';
import { getUser } from '../utils.js';

export function initRoutes(app: express.Application, io: Server, db: DataSource, jwt: JwtHelper) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
        res.json(getOidcOptions(Config.instance.server.baseUrl));
    });

    app.get('/api/v1/user/info', async (req: Request, res: Response) => {
        const user = await getUser(req, jwt, db);
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        res.json(user);
    });
}