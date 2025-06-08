import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { generateKeyPairSync, KeyObject } from 'crypto';

class JwtHelper {
    private readonly privateKey: KeyObject;
    private readonly publicKey: KeyObject;

    public constructor(privateKey: KeyObject, publicKey: KeyObject) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    public static createInstance(): JwtHelper {
        const { privateKey, publicKey } = JwtHelper.generateKeys();
        return new JwtHelper(privateKey, publicKey);
    }

    // 颁发JWT
    public issueToken(payload: object, audience: string, expiresInSeconds: number): string {
        const signOptions: SignOptions = {
            expiresIn: expiresInSeconds,
            algorithm: 'RS256',
            issuer: 'Asashio',
            audience,
        };
        return jwt.sign(payload, this.privateKey, signOptions);
    }

    // 验证JWT
    public verifyToken(token: string | null, audience: string | null = null): object | null {
        try {
            if (!token) return null;

            const decoded = jwt.verify(token, this.publicKey, {
                algorithms: ['RS256'],
                audience,
            } as VerifyOptions);

            if (typeof decoded === 'object' && decoded !== null) {
                return decoded;
            }

            return null;
        } catch (error) {
            console.error('JWT verification error:', (error as Error).message);
            return null;
        }
    }

    // 生成 RSA 公钥和私钥对
    public static generateKeys(): { privateKey: KeyObject, publicKey: KeyObject } {
        const { privateKey, publicKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
        });
        return { privateKey, publicKey };
    }
}

export default JwtHelper;