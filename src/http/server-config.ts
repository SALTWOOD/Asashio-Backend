import { DataSource } from "typeorm";
import { NonceGenerator } from "../nonce.js";
import JwtHelper from "../jwt.js";
import { Server as SocketIOServer } from "socket.io";
import { Hono } from "hono";

export interface ServerConfig {
    hono: Hono;
    database: DataSource;
    jwt: JwtHelper;
    io: SocketIOServer;
    nonce_generators: {
        deletion: NonceGenerator<{ userId: number }>;
    };
}