export class AppError extends Error {
    public statusCode: number;
    public data: any;

    constructor(message: string, statusCode: number = 500, data: any = null) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}