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

    const base = app.basePath('/api/v1');

    const quick = (c: any, data: any = null, code = 200, message = ReturnMessage.SUCCESS) =>
        c.json({ message, code, data, error: null }, code);

    // 当处理程序抛出错误时返回 JSON 响应
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

    // OpenID Connect Discovery
    app.get('/.well-known/openid-configuration', (c) => {
        return c.json(getOidcOptions(Config.instance.server.baseUrl));
    });

    // 状态检查
    base.get('/status', async (c) => {
        return quick(c, {
            status: 'ok',
            time: new Date(),
        });
    });

    // 用户信息
    base.get('/user/info', async (c) => {
        const user = await getUser(c, jwt, db);
        if (!user) return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);
        return quick(c, user.toJson());
    });

    // 用户登录
    base.post('/user/login', async (c) => {
        const { username, password } = await c.req.json();
        const user = await db.manager.findOne(UserInfo, { where: { username } });
        // 检查密码
        if (!user || !(await compare(password, user.pwd_hash))) {
            return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);
        }

        // 颁发 token
        const token = issueToken(jwt, user, Audience.USER);
        applyToken(c, token);
        return quick(c, { token });
    });

    // 用户注册
    base.post('/user/register', async (c) => {
        const { username, email, password } = await c.req.json();
        // 检查用户名或邮箱是否已存在
        const existing = await db.manager.exists(UserInfo, {
            where: [
                { username },
                { email }
            ]
        });
        if (existing) return quick(c, null, 409, ReturnMessage.CONFLICT);

        // 创建用户
        const newUser = await UserInfo.create(username, email, password);
        await db.manager.save(UserInfo, newUser);
        const token = issueToken(jwt, newUser, Audience.USER);
        applyToken(c, token);
        return quick(c, { token });
    });

    // 用户删除
    base.post('/user/delete', async (c) => {
        const { nonce } = await c.req.json();
        const user = await getUser(c, jwt, db);
        if (!user) return quick(c, null, 401, ReturnMessage.UNAUTHORIZED);

        // 检查 nonce
        if (!nonce) {
            // 如果没提供，就检查该账号是否有对应的删除 nonce
            let found = config.nonce_generators.deletion.find(n => n.userId === user.id)?.[0];
            if (!found) {
                // 如果没找到就生成一个
                found = config.nonce_generators.deletion.generate({ userId: user.id });
            }
            // 然后返回 nonce 给前端，要求用户输入以确认删除
            return quick(c, { success: false, nonce: found });
        }

        // 设置状态为被删除
        user.status = UserStatus.DELETED;
        await db.manager.save(UserInfo, user);
        config.nonce_generators.deletion.delete(nonce);
        return quick(c, { success: true, user: user.toJson() });
    });
}
