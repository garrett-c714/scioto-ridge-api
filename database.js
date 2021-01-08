
const sql = require('mysql');
const connection = sql.createConnection({
    host: 'jhdjjtqo9w5bzq2t.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'q4xk0vnlnhbctf2s',
    password: 'vn7zkmjduxjcdrp6',
    database: 'z2wyj04z0qj7sj68',
    insecureAuth: true
});

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
module.exports = {
    sendWaitTimes,
    insertUser,
    oneWaitTime
};