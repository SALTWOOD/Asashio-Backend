import { getOidcOptions } from '../models/oidc-options.js';
import { Config } from '../config.js';
import { Audience, ReturnMessage, UserStatus } from '../types/Enums.js';
import { compare } from 'bcrypt';
import { UserInfo } from '../types/UserInfo.js';
import { AppError } from '../types/AppError.js';
import { ServerConfig } from './server-config.js';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { applyToken, getUser, issueToken } from '../utils.js';

export function initRoutes(config: ServerConfig) {
    const app = config.hono;
    const db = config.database;
    const jwt = config.jwt;

    const quick = (c: any, data: any = null, code = 200, message = ReturnMessage.SUCCESS) =>
        c.json({ message, code, data, error: null }, code);

    app.use('*', async (c, next) => {
        try {
            await next();
        } catch (error: any) {
            const isAppError = error instanceof AppError;
            const statusCode = isAppError ? error.statusCode : 500;
            const data = isAppError ? error.data : null;

            if ([101, 204, 205, 304].includes(statusCode)) {
                return c.status(statusCode);
            }

            return c.json({
                message: ReturnMessage.ERROR,
                data,
                error: {
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                },
            }, statusCode as ContentfulStatusCode); // 上面排除了 ContentlessStatusCode，所以直接 as
        }
    });

    app.get('/.well-known/openid-configuration', (c) => {
        return c.json(getOidcOptions(Config.instance.server.baseUrl));
    });

    app.get('/api/v1/status', async (c) => {
        return quick(c, {
            status: 'ok',
            time: new Date(),
        });
    });

    app.get('/api/v1/user/info', async (c) => {
        const user = await getUser(c, jwt, db);
        if (!user) return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);
        return quick(c, user.toJson());
    });

    app.post('/api/v1/user/login', async (c) => {
        const { username, password } = await c.req.json();
        const user = await db.manager.findOne(UserInfo, { where: { username } });
        if (!user || !(await compare(password, user.pwd_hash))) {
            return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);
        }

        const token = issueToken(jwt, user, Audience.USER);
        applyToken(c, token);
        return quick(c, { token });
    });

    app.post('/api/v1/user/register', async (c) => {
        const { username, email, password } = await c.req.json();
        const existing = await db.manager.findOne(UserInfo, { where: { username } });
        if (existing) return quick(c, null, 409, ReturnMessage.CONFLICT);

        const newUser = await UserInfo.create(username, email, password);
        await db.manager.save(UserInfo, newUser);
        const token = issueToken(jwt, newUser, Audience.USER);
        applyToken(c, token);
        return quick(c, { token });
    });

    app.post('/api/v1/user/delete', async (c) => {
        const { nonce } = await c.req.json();
        const user = await getUser(c, jwt, db);
        if (!user) return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);

        if (!nonce) {
            let found = config.nonce_generators.deletion.find(n => n.userId === user.id)?.[0];
            if (!found) {
                found = config.nonce_generators.deletion.generate({ userId: user.id });
            }
            return quick(c, { success: false, nonce: found });
        }

        user.status = UserStatus.DELETED;
        await db.manager.save(UserInfo, user);
        config.nonce_generators.deletion.delete(nonce);
        return quick(c, { success: true, user: user.toJson() });
    });
}
