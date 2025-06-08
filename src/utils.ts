import { DataSource } from "typeorm";
import JwtHelper from "./jwt.js";
import { Request } from "express";
import { UserInfo } from "./types/UserInfo.js";
import { Audience } from "./types/Enums.js";

export function getToken(req: Request): string | null {
    return req.cookies.token || null;
}

export async function getUser(req: Request, jwt: JwtHelper, db: DataSource): Promise<UserInfo | null> {
    const payload = jwt.verifyToken(getToken(req), Audience.USER) as { id: number };
    if (!payload) return null;
    return db.manager.findOne(UserInfo, {
        where: { id: payload.id }
    });
}