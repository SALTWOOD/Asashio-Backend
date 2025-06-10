import { DataSource } from "typeorm";
import JwtHelper from "./jwt.js";
import { getCookie, setCookie } from 'hono/cookie';
import { UserInfo } from "./types/UserInfo.js";
import { Audience, RoleLevels, UserStatus } from "./types/Enums.js";
import { Config } from "./config.js";
import { Role } from "./types/Enums.js";
import { AppError } from "./types/AppError.js";
import { Context } from "hono";

export function getToken(c: Context): string | null {
    return getCookie(c, 'token') ?? null;
}

/**
 * 将 token 写入到响应对象的 Cookie 中
 * @param res 响应对象
 * @param token 令牌
 * @param expiresInSeconds 过期时间，默认 3 天
 */
export function applyToken(c: Context, token: string, expiresInSeconds: number = 60 * 60 * 24 * 3): void {
    setCookie(c, 'token', token, {
        secure: Config.instance.server.ssl.enabled,
        expires: new Date(Date.now() + 1000 * expiresInSeconds),
    });
}

/**
 * 颁发 JWT 令牌
 * @param jwt 传入一个 JwtHelper 实例
 * @param user 用户实例
 * @param audience 目标 audience
 * @param expiresInSeconds 过期时间，默认 3 天
 * @returns 
 */
export function issueToken(jwt: JwtHelper, user: UserInfo, audience: Audience, expiresInSeconds: number = 60 * 60 * 24 * 3): string {
    const token = jwt.issueToken({ id: user.id }, audience, expiresInSeconds);
    return token;
}

/**
 * 一键生成并返回登录 token
 * @param jwt 传入一个 JwtHelper 实例
 * @param c 响应对象
 * @param user 用户实例
 * @param expiresInSeconds 过期时间，默认 3 天
 * @returns token
 */
export function createLoginToken(jwt: JwtHelper, c: Context, user: UserInfo, expiresInSeconds: number = 60 * 60 * 24 * 3): string {
    const token = jwt.issueToken({ id: user.id }, Audience.USER, expiresInSeconds);
    applyToken(c, token);
    return token;
}

/**
 * 获取用户
 * @param c 响应对象
 * @param jwt 传入一个 JwtHelper 实例
 * @param db 数据库
 * @param ignoreStatus 忽略状态
 * @returns 用户信息
 */
export async function getUser(c: Context, jwt: JwtHelper, db: DataSource, ignoreStatus: boolean = false): Promise<UserInfo | null> {
    const payload = jwt.verifyToken(getToken(c), Audience.USER) as { id: number };
    if (!payload) return null;
    const user = await db.manager.findOne(UserInfo, {
        where: { id: payload.id }
    });
    if (!user) return null;
    if (ignoreStatus) return user;
    // 被删了就返回 null
    if (user.status === UserStatus.DELETED) return null;
    // 被夹了就爆炸
    if (user.status === UserStatus.BANNED) throw new AppError('User is banned', 403);
    return user;
}

/**
 * 判断指定用户是否拥有指定或更高的权限
 */
export function hasPermission(user: UserInfo | null, required: Role): boolean {
    if (!user) return false;
    const userLevel = RoleLevels[user.role];
    const requiredLevel = RoleLevels[required];
    return userLevel >= requiredLevel;
}