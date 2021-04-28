import { MONGO_DB_USER, MONGO_DB_PASSWORD } from './app-pass';

/**
 * Development
 */
export const FRONT_END_URL = "http://localhost:4200/";
export const BACK_END_URL = "http://localhost:3080/";


/**
 * Database
 */
export const DATABASE_NAME = "Finance";
export const MONGO_DB_URL = `mongodb+srv://dbUser:${MONGO_DB_PASSWORD}@clustercheckthebill.mlbb2.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`;


/**
 * Interfaces
 */
 export interface SignInExistUser {
    email: string;
    password: string;
}

export interface SignInNewUser {
    name: string;
    email: string;
    password: string;
}

export interface UserDetails {
    _id: string;
    name: string;
    occupation?: string;
    picture?: string;
}

export interface OldPassword {
    _id: string;
    password: string;
}

export interface RevenueItem {
    _id: string;
    _uid: string;
    category: string;
    name: string;
    january?: number;
    february?: number;
    march?: number;
    april?: number;
    may?: number;
    june?: number;
    july?: number;
    august?: number;
    september?: number;
    october?: number;
    november?: number;
    december?: number;
    notes?: string;
  }

export interface ExpenseItem {
    _id: string;
    _uid: string;
    category: string;
    name: string;
    january?: number;
    february?: number;
    march?: number;
    april?: number;
    may?: number;
    june?: number;
    july?: number;
    august?: number;
    september?: number;
    october?: number;
    november?: number;
    december?: number;
    notes?: string;
}




