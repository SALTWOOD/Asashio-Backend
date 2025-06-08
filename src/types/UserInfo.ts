import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role, UserStatus } from "./Enums.js";
import { hash, hashSync } from "bcrypt";

@Entity()
export class UserInfo {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public username: string = '';

    @Column()
    public email: string = '';

    @Column()
    public avatar: string = '';

    @Column()
    public role: Role = Role.USER;

    @Column()
    public status: UserStatus = UserStatus.NORMAL;

    // 使用 JSON 类型并添加转换器
    @Column({
        type: 'json'
    })
    public two_factor: TwoFactorAuth = {
        enabled: false,
        secret_totp: '',
        secret_webauthn: ''
    };

    @Column()
    public pwd_hash: string = '';

    constructor(username: string, email: string, pwd_hash: string) {
        this.username = username;
        this.email = email;
        this.pwd_hash = pwd_hash;
    }

    public static async create(username: string, email: string, password: string): Promise<UserInfo> {
        const hashedPassword = await hash(password, 10);
        return new UserInfo(username, email, hashedPassword);
    }

    public static createSync(username: string, email: string, password: string): UserInfo {
        const hashedPassword = hashSync(password, 10);
        return new UserInfo(username, email, hashedPassword);
    }
}

export interface TwoFactorAuth {
    enabled: boolean;
    secret_totp: string;
    secret_webauthn: string;
}