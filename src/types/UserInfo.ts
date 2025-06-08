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

    /**
     * 筛去部分敏感信息，然后返回 JSON 对象。
     * @param isPublic 指示该 JSON 是否对外显示。设定为 true 时将会隐藏更多信息。
     */
    public toJson(isPublic: boolean = false): any {
        const hideFunc = ({ two_factor, pwd_hash, ...rest }: UserInfo) => ({
            ...rest,
            two_factor: this.two_factor.enabled
        });
        const publicHideFunc = ({ email, status, ...rest }: UserInfo) => (rest);
        // 反正只是藏些数据，这样转型没问题的啦~
        const hidden = hideFunc(this) as unknown as UserInfo;
        return isPublic ? publicHideFunc(hidden) : hidden;
    }
}

export interface TwoFactorAuth {
    enabled: boolean;
    secret_totp: string;
    secret_webauthn: string;
}