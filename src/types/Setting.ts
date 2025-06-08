import { randomUUID } from "crypto";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    Unique
} from "typeorm";

@Entity()
export class Setting {
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column()
    @Index({ unique: true })
    public key: string;

    @Column("text")
    public value: string;

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}