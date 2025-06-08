import dotenv from 'dotenv';
import env from 'env-var';

export class Config {
    private static _instance: Config;

    private constructor() {
        dotenv.config();
    }

    public static get instance(): Config {
        if (!Config._instance) {
            Config._instance = new Config();
        }
        return Config._instance;
    }

    public readonly server = {
        host: env.get('HOST').default('').asString(),
        port: env.get('PORT').default(3000).asPortNumber(),
        baseUrl: env.get('BASE_URL').default('http://localhost:3000').asString(),

        ssl: {
            enabled: env.get('SSL_ENABLED').default(0).asBool(),
            key: env.get('SSL_KEY').default('').asString(),
            cert: env.get('SSL_CERT').default('').asString()
        }
    };

    public readonly database = {
        type: env.get('DB_TYPE').default('postgres').asString(),
        host: env.get('DB_HOST').default('localhost').asString(),
        port: env.get('DB_PORT').default(5432).asPortNumber(),
        username: env.get('DB_USERNAME').default('postgres').asString(),
        password: env.get('DB_PASSWORD').default('postgres').asString(),
        database: env.get('DB_DATABASE').default('asashio').asString(),
        synchronize: env.get('DB_SYNCHRONIZE').default(0).asBool()
    };
}

