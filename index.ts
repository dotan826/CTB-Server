import express from 'express';
import * as path from 'path';
import * as login from './src/app-login';
import * as database from './src/app-database';
import { UserDetails, OldPassword } from './src/app-constants';
import { ObjectId } from 'mongodb';
import Multer from 'multer';
import schedule from 'node-schedule';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { format } from 'util';

const app = express();
const PORT = process.env.PORT || 3080;

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ DEVELOPMENT ONLY
// const cors = require("cors"); // FOR TESTING / DEVELOPMENT !
import cors from 'cors';

const corsOptions = { // FOR TESTING / DEVELOPMENT !
    origin: 'http://localhost:3080'
}
app.use(cors(corsOptions)); // FOR TESTING / DEVELOPMENT !
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ DEVELOPMENT ONLY

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Check if the request made from Secure (HTTPS) url - if not, it redirect the client browser to HTTPS !
app.use(function (req, resp, next) {
    if (req.headers['x-forwarded-proto'] == 'http') {
        return resp.redirect(301, 'https://' + req.headers.host + '/');
    } else {
        return next();
    }
});

// Add this line after we have the build ----->>>>>
// app.use(express.static(path.join(__dirname, "build")));




/**
 * Testing Area ! Watch Out !
 */

//  database.deleteAllGuestUsers(); // delete all guest users + expense + revenue !!!

/**
 * Testing Area ! Watch Out !
 */








/**
 * Server APIs :
 * 
 */

/**
 * Upload Profile Picture : (First Edition - before changes)
 */
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },

//     // By default, multer removes file extensions so let's add them back
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });
// // let upload = multer({ dest: 'uploads/' });
// // 'profile_pic' is the name of our file input field in the HTML form
// let upload = multer({ storage: storage }).single('profile-pic');
// app.post('/api/profile/set', upload, (req, res, next) => {
//     // req.file is the `avatar` file
//     // req.body will hold the text fields, if there were any

//     console.log("Picture has been Upload ! Woohoo !");
//     res.send(true);
// });




/**
 * Upload Profile Picture : (Second Edition - after changes for Local Computer Use)
 */
// const storage = multer.diskStorage({
//     destination: function (req: any, file: any, cb: any) {
//         cb(null, 'uploads/');
//     },

//     // By default, multer removes file extensions so let's add them back
//     filename: function (req: any, file: any, cb: any) {
//         // cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//         cb(null, req.params.uid + path.extname(file.originalname));
//     }
// });
// let upload = multer({ storage: storage });
// app.post('/api/profile/set/:uid', upload.single("profile-pic"), function (req, res) {


//     console.log("form field is : ", req.file.fieldname);
//     console.log("file name is : ", req.file.filename);

//     res.send(true);

//     // app.get('/user/:uid/photos/:file', function(req, res){
//     //     var uid = req.params.uid
//     //       , file = req.params.file;

// });




/**
 * Upload Profile Picture : (Third Edition - after changes for Internet Use)
 */
const multer = Multer({
    storage: Multer.memoryStorage(), // Store the file into memory - we can read it through Buffer
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },

});
const projectId = 'testing-only-290906'; // Project ID (From Google Console)
const keyFilename = './key/testing-only-290906-1723746aa27b.json'; // Project Sevice Key File (Google Cloud Console >> IAM & Admin >> Service Accounts)
const storage = new Storage({ projectId, keyFilename }); // set Auth for Google Cloud Storage
const profilePictures = storage.bucket("finance-overall-storage"); // set Bucket Name

app.post('/api/profile/set/:uid', multer.single("profile-pic"), function (req, res) { // api for upload file

    const gcsFileName = `${req.params.uid}.jpeg`; // creating a new file name

    // Create a new blob in the bucket and upload the file data.
    const fileToUpload = profilePictures.file(gcsFileName); // creating a file in google cloud storage
    const fileToUploadStream = fileToUpload.createWriteStream(); // upload the file

    // if Error
    fileToUploadStream.on('error', err => {
        console.log("Can't Upload Picture.", err);
        console.log(err);
    });

    // if Finish Upload
    fileToUploadStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        // const publicUrl = format(
        //     `https://storage.googleapis.com/${profilePictures.name}/${blob.name}`
        // );
        // res.status(200).send(publicUrl);
        console.log("File Uploaded.");
        res.send(true);
    });

    fileToUploadStream.end(req.file.buffer);

});











/**
 * Get Profile Picture :
 */
app.use('/uploads', express.static('uploads')); // serve profile pictures
// app.post('/api/profile/get', (req, res) => {
//     res.sendFile(`${req.body["_id"]}.png`, { root: path.join(__dirname, 'uploads') });
// });

/**
 * Login - Exist User
 */
app.post("/api/login/exist", (req, res) => {
    login.existUser(req.body).then((document) => {
        if (document) {
            let doc = document as UserDetails;
            res.send({
                "_id": doc._id,
                "name": doc.name,
                "occupation": doc.occupation,
                "picture": doc.picture
            });
        }
        else {
            res.send(document); // return false if cant login
        }
    });
});

/**
 * Login - New User
 */
app.post("/api/login/new", (req, res) => {
    login.newUser(req.body).then((document) => {
        if (document) {
            let doc = document as UserDetails;
            if (doc.name.localeCompare("Guest") === 0) { // if Guest User trying to login
                res.send({
                    "_id": doc._id,
                    "name": doc.name
                });
            }
            else if (doc.name.localeCompare("Guest") !== 0) { // if Normal User trying to login
                const gcsFileName = `${doc._id}.jpeg`; // creating a new file name
                profilePictures.file("Guest.jpeg").copy(gcsFileName).then(
                    (copyResponse) => {
                        if (copyResponse[0]) {
                            console.log("Copy profile picture for New User.");
                            res.send({
                                "_id": doc._id,
                                "name": doc.name
                            });
                        }
                        else {
                            console.log("Failed to Copy profile picture for New User.");
                            res.send(false); // return false if failed to copy new profile picture
                        }
                    }
                );

                // console.log("Copy new picture for  :", doc.name, " ", doc._id);
                // fs.copyFile(path.join(__dirname, 'uploads', 'Guest.jpg'), path.join(__dirname, 'uploads', `${doc._id}.jpg`), (err) => {
                //     if (err) {
                //         console.log("Can't copy profile picture for New User.");
                //         throw err;
                //     }
                // });
            }
        }
        else {
            res.send(document); // return false if cant create
        }
    });
});

/**
 * Get User Details
 */
app.post("/api/users/get", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.readSpecificDocument(db, "Users", { "_id": new ObjectId(req.body["_id"]) }).then((result) => {
            if (result) {
                let doc = result as UserDetails;
                res.send({
                    "_id": doc._id,
                    "name": doc.name,
                    "occupation": doc.occupation,
                    "picture": doc.picture
                });
            }
            else {
                res.send(false);
            }
        });
    });
});

/**
 * Update User Details
 */
app.post("/api/users/update", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.updateSpecificDocument(db, "Users", { "_id": new ObjectId(req.body[0]) }, { $set: req.body[1] }).then((result) => {
            if (result) {
                res.send(result);
            }
            else {
                res.send(false);
            }
        });
    });
});

/**
 * Valid old password (for update purpose)
 */
app.post("/api/users/pass", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.readSpecificDocument(db, "Users", { "_id": new ObjectId(req.body[0]) }).then((result) => {
            if (result) {
                let oldPassword = result as OldPassword;
                if (oldPassword["password"].localeCompare(req.body[1]) === 0) { // if old password same as in database
                    res.send(true);
                }
                else { // if old password different from database
                    res.send(false);
                }
            }
            else {
                res.send(false);
            }
        });
    });
});

interface ValidPass {
    password: string
}

/**
 * Get All User Revenues
 */
app.post("/api/revenue/get", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        db.collection("Revenue").find({ "_uid": req.body["_id"] }).toArray((err, documents) => {
            if (err) {
                console.log("Can't Retrieve Revenues Collection !");
                throw err;
            }
            else {
                res.send(documents);
            }
        });
    });
});

/**
 * Add Revenue
 */
app.post("/api/revenue/add", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.insertSpecificDocument(db, "Revenue", { "_id": new ObjectId(req.body["_id"]), ...req.body }).then(
            (result) => {
                res.send(result);
            }
        )
    });
});

/**
 * Delete Revenue
 */
app.post("/api/revenue/delete", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.deleteSpecificDocument(db, "Revenue", { "_id": new ObjectId(req.body["_id"]) }).then(
            (result) => {
                res.send(result);
            }
        );
    });
});

/**
 * Update Revenue
 */
app.post("/api/revenue/update", (req, res) => {
    let newDocument = {
        _uid: req.body["_uid"],
        category: req.body["category"],
        name: req.body["name"],
        january: req.body["january"],
        february: req.body["february"],
        march: req.body["march"],
        april: req.body["april"],
        may: req.body["may"],
        june: req.body["june"],
        july: req.body["july"],
        august: req.body["august"],
        september: req.body["september"],
        october: req.body["october"],
        november: req.body["november"],
        december: req.body["december"],
        notes: req.body["notes"]
    }
    database.connectAndGetDatabaseObject().then((db) => {
        database.updateSpecificDocument(db, "Revenue", { "_id": new ObjectId(req.body["_id"]), "_uid": req.body["_uid"] }, { $set: newDocument }).then((result) => {
            if (result) {
                res.send(result);
            }
            else {
                res.send(false);
            }
        });
    });
});

/**
 * Update Revenue Notes
 */
app.post("/api/revenue/updateNotes", (req, res) => {
    let newDocument = {
        notes: req.body["notes"]
    }
    database.connectAndGetDatabaseObject().then((db) => {
        database.updateSpecificDocument(db, "Revenue", { "_id": new ObjectId(req.body["_id"]), "_uid": req.body["_uid"] }, { $set: newDocument }).then((result) => {
            if (result) {
                res.send(result);
            }
            else {
                res.send(false);
            }
        });
    });
});

/**
 * Get All User Expenses
 */
app.post("/api/expense/get", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        db.collection("Expense").find({ "_uid": req.body["_id"] }).toArray((err, documents) => {
            if (err) {
                console.log("Can't Retrieve Expenses Collection !");
                throw err;
            }
            else {
                res.send(documents);
            }
        });
    });
});

/**
 * Add Expense
 */
app.post("/api/expense/add", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.insertSpecificDocument(db, "Expense", { "_id": new ObjectId(req.body["_id"]), ...req.body }).then(
            (result) => {
                res.send(result);
            }
        )
    });
});

/**
 * Delete Expense
 */
app.post("/api/expense/delete", (req, res) => {
    database.connectAndGetDatabaseObject().then((db) => {
        database.deleteSpecificDocument(db, "Expense", { "_id": new ObjectId(req.body["_id"]) }).then(
            (result) => {
                res.send(result);
            }
        );
    });
});

/**
 * Update Expense
 */
app.post("/api/expense/update", (req, res) => {
    let newDocument = {
        _uid: req.body["_uid"],
        category: req.body["category"],
        name: req.body["name"],
        january: req.body["january"],
        february: req.body["february"],
        march: req.body["march"],
        april: req.body["april"],
        may: req.body["may"],
        june: req.body["june"],
        july: req.body["july"],
        august: req.body["august"],
        september: req.body["september"],
        october: req.body["october"],
        november: req.body["november"],
        december: req.body["december"],
        notes: req.body["notes"]
    }
    database.connectAndGetDatabaseObject().then((db) => {
        database.updateSpecificDocument(db, "Expense", { "_id": new ObjectId(req.body["_id"]), "_uid": req.body["_uid"] }, { $set: newDocument }).then((result) => {
            if (result) {
                res.send(result);
            }
            else {
                res.send(false);
            }
        });
    });
});

/**
 * Update Expense Notes
 */
app.post("/api/expense/updateNotes", (req, res) => {
    let newDocument = {
        notes: req.body["notes"]
    }
    database.connectAndGetDatabaseObject().then((db) => {
        database.updateSpecificDocument(db, "Expense", { "_id": new ObjectId(req.body["_id"]), "_uid": req.body["_uid"] }, { $set: newDocument }).then((result) => {
            if (result) {
                res.send(result);
            }
            else {
                res.send(false);
            }
        });
    });
});

// Schedule every 24 hours to delete all Guest Users from database
const job = schedule.scheduleJob('3 * * *', function () {
    database.deleteAllGuestUsers();
});


















// Redirect all unknown urls back to main page !
app.get('*', function (req, res) {
    //   res.redirect("/index.html");
    res.send("We are Running !"); // FOR TESTING WHILE WORKING ON BACK-END
});

// Start server listening
app.listen(PORT, () => {
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
    console.log(`We are running at http://localhost:${PORT}/ !`);
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
});




