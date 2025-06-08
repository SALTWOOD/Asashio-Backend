import express from 'express';
import { Server } from 'socket.io';
import { DataSource } from 'typeorm';
import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';
import { Request, Response, NextFunction } from 'express';
import { getUser, applyToken, issueToken } from '../utils.js';
import { Audience, ReturnMessage } from '../types/Enums.js';
import JwtHelper from '../jwt.js';
import { compare, hash } from 'bcrypt';
import { UserInfo } from '../types/UserInfo.js';
import cookieParser from 'cookie-parser';

export function initRoutes(app: express.Application, io: Server, db: DataSource, jwt: JwtHelper) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
        res.json(getOidcOptions(Config.instance.server.baseUrl));
    });

    app.get('/api/v1/user/info', async (req: Request, res: Response) => {
        const user = await getUser(req, jwt, db);
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        res.json({
            data: user,
            message: ReturnMessage.SUCCESS
        });
    });

    app.post('/api/v1/user/login', async (req: Request, res: Response) => {
        const { username, password } = req.body;
        const user = await db.manager.findOne(UserInfo, {
            where: { username }
        });
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (await compare(password, user.pwd_hash)) {
            const token = issueToken(jwt, user, Audience.USER);
            applyToken(res, token);
            res.json({
                data: { token },
                message: ReturnMessage.SUCCESS
            });
            return;
        } else {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
    });

    app.post('/api/v1/user/register', async (req: Request, res: Response) => {
        const { username, email, password } = req.body;
        const user = await db.manager.findOne(UserInfo, {
            where: { username }
        });
        if (user) {
            res.status(409).json({ message: 'Conflict' });
            return;
        }
        const newUser = await db.manager.save(UserInfo, await UserInfo.create(username, email, password));
        const token = issueToken(jwt, newUser, Audience.USER);
        applyToken(res, token);
        res.json({
            data: { token },
            message: ReturnMessage.SUCCESS
        });
    });
}