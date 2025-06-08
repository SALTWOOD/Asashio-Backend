import { randomUUID } from "crypto";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    Unique
} from "typeorm";

@Entity()
@Unique(["key"])
export class Setting {
    @PrimaryGeneratedColumn()
    public readonly id: string;

    @Column()
    @Index({ unique: true })
    public key: string;

    @Column("text")
    public value: string;

    constructor(key: string, value: string) {
        this.id = randomUUID();
        this.key = key;
        this.value = value;
    }
}