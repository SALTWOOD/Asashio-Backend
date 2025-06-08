import { DataSource } from "typeorm";
import JwtHelper from "./jwt.js";
import { Request, Response } from "express";
import { UserInfo } from "./types/UserInfo.js";
import { Audience } from "./types/Enums.js";
import { Config } from "./config.js";

export function getToken(req: Request): string | null {
    return req.cookies.token || null;
}

/**
 * 将 token 写入到响应对象的 Cookie 中
 * @param res 响应对象
 * @param token 令牌
 * @param expiresInSeconds 过期时间，默认 3 天
 */
export function applyToken(res: Response, token: string, expiresInSeconds: number = 60 * 60 * 24 * 3): void {
    res.cookie('token', token, {
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
 * @param res 响应对象
 * @param user 用户实例
 * @param expiresInSeconds 过期时间，默认 3 天
 * @returns 
 */
export function createLoginToken(jwt: JwtHelper, res: Response, user: UserInfo, expiresInSeconds: number = 60 * 60 * 24 * 3): string {
    const token = jwt.issueToken({ id: user.id }, Audience.USER, expiresInSeconds);
    applyToken(res, token);
    return token;
}

export async function getUser(req: Request, jwt: JwtHelper, db: DataSource): Promise<UserInfo | null> {
    const payload = jwt.verifyToken(getToken(req), Audience.USER) as { id: number };
    if (!payload) return null;
    return db.manager.findOne(UserInfo, {
        where: { id: payload.id }
    });
}