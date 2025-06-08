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

    @Column()
    public two_factor = {
        enabled: false,
        secret_totp: '',
        secret_webauthn: ''
    };

    @Column()
    public pwd_hash: string = '';
}