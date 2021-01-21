
function requirePath(modulePath) {
    try {
        return require(modulePath);
    } catch(error) {
        console.log('path not found');
        return false;
    }
}
const creds = requirePath('./creds');
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
function insertSession(userID) {
    return new Promise((resolve, reject) => {
        const session = generateSession();
        const query = `DELETE FROM sessions WHERE user = '${userID}'; INSERT INTO sessions (session_id, user) VALUES ('${session}', '${userID}');`;
        console.log(`${session} inserted into database`);
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            }
        });
        resolve(session);
    });
}


function login(email, password) {
    const query = `SELECT password, user_id FROM users WHERE email = '${email}';`;
    return new Promise((resolve,reject) => {
        connection.query(query, (error,result) => {
            console.log(email);
            if (error) {
                reject(new Error('selection failed'));
            } else if (result[0] == undefined) {
                reject(new Error('invalid email'));
            } else {
                if (password === result[0].password) {
                    resolve(result[0].user_id);
                } else {
                    reject(new Error('invalid password'));
                }
            }
        });
    });
}
function validateSession(sessionID) {
    const query = `SELECT user FROM sessions WHERE session_id = '${sessionID}';`;
    return new Promise((resolve, reject) => {
        connection.query(query,(error, result) => {
            if (error) {
                reject(new Error('selection failed'));
            } else if (result[0] == undefined){
                reject(new Error('no session'));
            } else {
                resolve(result[0].user);
            }
        });
    });
}
function returnSession(sessionID) {
    return new Promise((resolve, reject) => {
        validateSession(sessionID)
        .then(userID => {
            const query = `SELECT first_name, last_name FROM users WHERE user_id = '${userID}';`
            connection.query(query, (error, result) => {
                if (error) {
                    reject(new Error('selection failed'));
                } else if (result[0].first_name == undefined) {
                    reject(new Error('no data associated with user'));
                } else {
                    resolve({
                        firstName: `${result[0].first_name}`,
                        lastName: `${result[0].last_name}`
                    });
                }
            });
        })
        .catch(error => {
            //no session, nothing really to catch.
        });
    });
}
function deleteSession(sessionID) {
    const query = `DELETE FROM sessions WHERE session_id = '${sessionID}'`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('deletion failed'));
                //throw error;
            } else {
                resolve('successfully deleted from the sessions');
            }
        });
    });
}

function getStarReview(attID) {
    const query = `SELECT num_stars, num_reviews FROM attraction_reviews WHERE id = '${attID}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                //reject(new Error('selection failed'));
                throw error;
            } else {
                resolve({
                    stars: `${result[0].num_stars}`,
                    reviews: `${result[0].num_reviews}`
                });
            }
        });
    });
}
async function insertStarReview(attID, rating) {
    const oldNumbers = await getStarReview(attID);
    oldNumbers.stars += rating;
    oldNumbers.reviews++;
    const query = `UPDATE attraction_reviews SET num_stars = ${oldNumbers.stars} WHERE id = '${attID}'; UPDATE attraction_reviews SET num_reviews = ${oldNumbers.reviews} WHERE id = '${attID}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('review insertion failed'));
            } else {
                resolve();
            }
        });
    });
}
module.exports = {
    sendWaitTimes,
    insertUser,
    oneWaitTime,
    login,
    insertSession,
    returnSession,
    deleteSession,
    getStarReview,
    insertStarReview
};