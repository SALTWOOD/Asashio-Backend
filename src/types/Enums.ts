export enum ReturnMessage {
    SUCCESS = 'Success',
    ERROR = 'Error',
    UNAUTHORIZED = 'Unauthorized',
    FORBIDDEN = 'Forbidden',
    NOT_FOUND = 'Not Found',
    CONFLICT = 'Conflict',
    UNPROCESSABLE_ENTITY = 'Unprocessable Entity',
    INTERNAL_SERVER_ERROR = 'Internal Server Error',
    NOT_IMPLEMENTED = 'Not Implemented',
}

export enum Audience {
    USER = 'user-token'
}

export enum Role {
    GUEST = 'guest',
    USER = 'user',
    ADMIN = 'admin'
}

export const RoleLevels: Record<Role, number> = {
    [Role.GUEST]: 0,
    [Role.USER]: 1,
    [Role.ADMIN]: 2
};

export enum UserStatus {
    NORMAL = 0,
    DELETED = 1,
    BANNED = 2
};