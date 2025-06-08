import { randomBytes } from "crypto";

interface NonceData<T> {
    data: T;
    expiresAt: number;
}

export class NonceGenerator<T> {
    private store: Map<string, NonceData<T>>;
    private defaultTTL: number;

    /**
     * 创建 Nonce 生成器
     * @param defaultTTL 默认有效期（毫秒），默认 5 分钟
     */
    constructor(defaultTTL: number = 5 * 60 * 1000) {
        this.store = new Map();
        this.defaultTTL = defaultTTL;

        setInterval(this.cleanupExpired.bind(this), 60 * 1000);
    }

    /**
     * 生成带有效期的 Nonce
     * @param data 要关联的数据
     * @param ttl 有效期（毫秒），可选
     * @returns Nonce
     */
    generate(data: T, ttl?: number): string {
        const nonce = this.generateHex(10);
        const expiresAt = Date.now() + (ttl ?? this.defaultTTL);

        this.store.set(nonce, {
            data,
            expiresAt
        });

        return nonce;
    }

    /**
     * 验证 Nonce 并获取关联数据
     * @param nonce 要验证的 Nonce
     * @returns 数据
     */
    verify(nonce: string): T | null {
        const record = this.store.get(nonce);
        if (!record) return null;

        if (Date.now() > record.expiresAt) {
            this.store.delete(nonce);
            return null;
        }

        return record.data;
    }

    /**
     * 手动清理过期 Nonce
     */
    cleanupExpired() {
        const now = Date.now();
        for (const [nonce, record] of this.store.entries()) {
            if (now > record.expiresAt) {
                this.store.delete(nonce);
            }
        }
    }

    /**
     * 生成指定长度的 Hex 字符串
     * @param length 字符串长度
     * @returns Hex 字符串
     */
    private generateHex(length: number): string {
        if (length % 2 !== 0) {
            throw new Error('Hex length must be even');
        }

        const byteLength = length / 2;
        return randomBytes(byteLength).toString('hex');
    }
}