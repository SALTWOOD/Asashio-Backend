import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { Role } from "./Role.js";

@Entity()
export class UserInfo {
    @PrimaryGeneratedColumn()
    public id: number = 0;

    @Column()
    public username: string = '';

    @Column()
    public email: string = '';

    @Column()
    public avatar: string = '';

    @Column()
    public role: Role = 'user';

    // 使用 JSON 类型并添加转换器
    @Column({
        type: 'json',
        transformer: {
            to: (value: TwoFactorAuth) => JSON.stringify(value),
            from: (value: string) => JSON.parse(value)
        }
    })
    public two_factor: TwoFactorAuth = {
        enabled: false,
        secret_totp: '',
        secret_webauthn: ''
    };

    @Column()
    public pwd_hash: string = '';
}

export interface TwoFactorAuth {
    enabled: boolean;
    secret_totp: string;
    secret_webauthn: string;
}