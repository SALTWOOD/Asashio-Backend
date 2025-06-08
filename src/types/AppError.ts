import { StatusCode } from "hono/utils/http-status";

export class AppError extends Error {
    public statusCode: StatusCode;
    public data: any;

    constructor(message: string, statusCode: StatusCode = 500, data: any = null) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}