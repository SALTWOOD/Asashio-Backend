import express from 'express';
import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';
import { Request, Response, NextFunction } from 'express';
import { getUser, applyToken, issueToken, hasPermission } from '../utils.js';
import { Audience, ReturnMessage, Role, UserStatus } from '../types/Enums.js';
import { compare, hash } from 'bcrypt';
import { UserInfo } from '../types/UserInfo.js';
import cookieParser from 'cookie-parser';
import { ServerConfig } from './server-config.js';
import { AppError } from '../types/AppError.js';

function getErrorHandler(config: ServerConfig) {
    return async (error: Error, req: Request, res: Response, next: NextFunction) => {
        const isAppError = error instanceof AppError;
        const statusCode = isAppError ? error.statusCode : 500;
        const data = isAppError ? error.data : null;

        let sendStack = false;
        // 都报错了还是保险些，加个 try
        try {
            const isDev = process.env.NODE_ENV === 'development';
            const isAdmin = hasPermission(await getUser(req, config.jwt, config.database), Role.ADMIN);
            if (isDev || isAdmin) sendStack = true;
        } catch (e) {
            sendStack = false;
        }

        // 统一响应格式
        res.status(statusCode).json({
            message: error.message,
            data,
            stack: sendStack ? error.stack : undefined
        });
    };
}

export function initRoutes(config: ServerConfig) {
    const app = config.express;
    const db = config.database;
    const jwt = config.jwt;

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

    app.post('/api/v1/user/delete', async (req: Request, res: Response) => {
        const user = await getUser(req, jwt, db);
        if (!user) {
            res.status(401).json({ message: ReturnMessage.UNAUTHORIZED });
            return;
        }
        if (!req.body.nonce) {
            let nonce = config.nonce_generators.deletion.find(nonce => nonce.userId === user.id)?.[0];
            if (!nonce) {
                nonce = config.nonce_generators.deletion.generate({ userId: user.id });
            }
            res.status(200).json({
                message: ReturnMessage.SUCCESS,
                data: {
                    success: false,
                    nonce
                }
            });
            return;
        }
        // await db.manager.delete(UserInfo, user.id);
        // 暂时将账户的状态设为删除但不实际删除数据
        user.status = UserStatus.DELETED;
        await db.manager.save(UserInfo, user);
        res.json({
            message: ReturnMessage.SUCCESS,
            data: user
        });
    });

    app.use(getErrorHandler(config));
}