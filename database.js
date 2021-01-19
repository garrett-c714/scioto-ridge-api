const creds = require('./creds');
const sql = require('mysql');
const database = process.env.JAWSDB_URL || creds.database;
const connection = sql.createConnection(database);

connection.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('Connected to Database!');
});

function selectWaitTimes() {
    const query = "SELECT name, wait_time, att_id FROM attractions;";
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (result == undefined) {
                reject(new Error('rows is undefined'));
            } else {
                resolve(result);
            }
        });
    });
}
function oneWaitTime(id) {
    const query = `SELECT * FROM attractions WHERE att_id = '${id}'`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (result === undefined) {
                reject(new Error('Result is undefined'));
            } else {
                resolve(result);
            }
        });
    });
}
async function sendWaitTimes() {
    let response = {};
    const rawData = await selectWaitTimes();
    rawData.forEach(entry => {
        let indexName = `index${entry.att_id}`;
        response[indexName] = {
            name: `${entry.name}`,
            waitTime: `${entry.wait_time}`
        };
    });
    return response;
}
function insertUser(newUser) {
    const query = `INSERT INTO users (first_name, last_name, email, password) VALUES ('${newUser.fName}', '${newUser.lName}', '${newUser.email}','${newUser.password}');`
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                console.log('Inserted Successfully into Database!');
                resolve('success');
            }
        });
    });
}

function generateSession() {
    return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);
}
function insertSession() {
    return new Promise((resolve, reject) => {
        const session = generateSession();
        const query = `INSERT INTO sessions (session_id, user) VALUES ('${session}', '1001');`;
        console.log(`${session} inserted into database`);
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            }
        });
        resolve(session);
    });
}
async function sessionData(user) {
    const session = await insertSession();
}

function login(email, password) {
    const query = `SELECT password FROM users WHERE email = ${email};`;
    return new Promise((resolve,reject) => {
        connection.query(query, (error,result) => {
            if (error) {
                reject(new Error('selection failed'));
            } else {
                if (result[0].password === password) {
                    resolve('success');
                } else {
                    reject('invalid email or password');
                }
            }
        });
    });
}
module.exports = {
    sendWaitTimes,
    insertUser,
    oneWaitTime,
    login
};