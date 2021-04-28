// New and Exist Users Login

// const database = require("./database.js"); // Database Functions
import * as database from './app-database'; // Database Functions
// import { Db } from 'mongodb';

// Login Exist User
/*
    Blueprint of User Document :
    {
        email: ...
        password: ...
    }

    Parameters :
    userDetails = User Details Object like blueprint
    
    Return :
    If User Exist >>> document
    If User NOT Exist >>>> false
*/
interface userDetails {
    _id?: string;
    name?: string;
    occupation?: string;
    email: string;
    password: string;
    picture?: string;
}
export const existUser = async (userDetails: userDetails) => {
    const result = new Promise((res, rej) => {
        database.connectAndGetDatabaseObject().then((db) => {
            database.readSpecificDocument(db, "Users", { email: userDetails.email, password: userDetails.password }).then((document) => {
                if (document === null) {
                    console.log("User Not Exist !");
                    res(false); // User Not Exist !
                }
                else {
                    res(document); // User Exist !
                }
            });
        });
    });
    return result;
}

// Login New User
/*
    Blueprint of User Document :
    {
        email: ...
        password: ...
    }

    Parameters :
    userDetails = User Details Object like blueprint
    
    Return :
    If User Exist >>> false
    If User NOT Exist >>>> document
*/
export const newUser = async (userDetails: userDetails) => {
    const result = new Promise((res, rej) => {
        database.connectAndGetDatabaseObject().then((db) => {
            if(userDetails.name?.localeCompare("Guest") === 0 &&
                userDetails.email.localeCompare("") === 0 &&
                userDetails.password.localeCompare("") === 0){
                    database.insertSpecificDocument(db, "Users", {...userDetails, occupation: "", picture: ""}).then((insertResult) => {
                        res(insertResult.ops[0]); // User has been Created !
                    });
            }
            else{
                existUser(userDetails).then((checkIfUserExist) => {
                    if (checkIfUserExist) {
                        res(false); // User Already Exist
                    }
                    else {
                        database.insertSpecificDocument(db, "Users", {...userDetails, occupation: "", picture: ""}).then((insertResult) => {
                            res(insertResult.ops[0]); // User has been Created !
                        });
                    }
                });
            }
        });
    });
    return result;
}

// exports functions out as a module
// exports.existUser = existUser;
// exports.newUser = newUser;












