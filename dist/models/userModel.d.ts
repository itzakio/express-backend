import { ObjectId } from 'mongodb';
export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    refreshToken?: string;
    createdAt: Date;
}
export declare const getUsersCollection: () => import("mongodb").Collection<User>;
export declare function findUserByEmail(email: string): Promise<User | null>;
export declare function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<User>;
//# sourceMappingURL=userModel.d.ts.map