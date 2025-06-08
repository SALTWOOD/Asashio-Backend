import type { Role } from "./Role";

export class UserInfo {
    id: number = 0;
    username: string = '';
    email: string = '';
    avatar: string = '';
    role: Role = 'user';
}