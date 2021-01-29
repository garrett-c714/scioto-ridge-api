
function requirePath(modulePath) {
    try {
        return require(modulePath);
    } catch(error) {
        console.log('path not found');
        return false;
    }
}
const creds = requirePath('./creds');
const info = require('./info');
const sql = require('mysql');
const database = process.env.JAWSDB_URL || creds.database;
const connection = sql.createConnection(database);

/*This file contains the functions for accessing the database. Each route in app.js
calls one or more of these functions to perform actions in the database */




/*Connects the database. Credentials are stored in an environment
vairable in the host server */
connection.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('Connected to Database!');
});

/*Selects the wait times from the database, through a series of steps, that 
data is turned into JSON and returned with the http response */
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

/*This function updates the attraction status and wait time when an admin modifies the 
data on the frontend. */

const changeTime = (attraction, newTime, isClosed) => {
    const query = `UPDATE attractions SET wait_time = '${newTime}' WHERE att_id = '${attraction}';`;
    const query2 = `UPDATE attractions SET is_closed = '${isClosed}' WHERE att_id = '${attraction}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('update wait time failed'));
                //throw error;
            } 
        });
        connection.query(query2, (error, result) => {
            if (error) {
                reject(new Error('query2 failure :)'));
                //throw error;
            } else {
                resolve();
            }
        });
    });
}

/*inserts a new user into the database. If the email is already in use
the promise will reject, and will be caught by the route in app.js */
function insertUser(fName, lName, email, password) {
    const query = `INSERT INTO users (first_name, last_name, email, password) VALUES ('${fName}', '${lName}', '${email}','${password}');`
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('duplicate email'));
            } else {
                //console.log('Inserted Successfully into Database!');
                resolve('success');
            }
        });
    });
}
const getEmail = user => {
    const query = `SELECT email FROM users WHERE user_id = '${user}';`;
    return new Promise((resolve,reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('email selectio failed'));
                //throw error;
            } else {
                resolve(result[0].email);
            }
        });
    });
}
/*generates the random session ID */
function generateSession() {
    return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);
}
function insertSession(userID) {
    deleteSessionByUser(userID);
    return new Promise((resolve, reject) => {
        const session = generateSession();
        const query = `INSERT INTO sessions (session_id, user) VALUES ('${session}', '${userID}');`;
        console.log(`${session} inserted into database`);
        connection.query(query, (error, result) => {
            if (error) {
                //throw error;
                reject(new Error('session insertion'));
            }
        });
        resolve(session);
    });
}

/*validates credentials with the data from the login request. User passwords are encrypted
in the database */
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
/*compares user request to the admin table to determine permission to access certain 
functions */
const checkIfAdmin = user => {
    const query = `SELECT id_number, badge FROM admins WHERE id_number = '${user}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('admin selection failed'));
            } else if (result[0].badge == undefined) {
                reject(new Error('not an admin'));
            } else {
                resolve(result[0].id_number);
            }
        });
    });
}
/*validates the session with the sessionId passed into it, if no session is present 
the promise rejects, and the route will send that there is no active session to the 
Frontend */
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

/*selects user data when given a session ID*/
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
            reject(new Error('no session'));
        });
    });
}
/*deletes session from the database upon logout */
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
function deleteSessionByUser(userID) {
    const query = `DELETE FROM sessions WHERE user = '${userID}'`;
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
                reject(new Error('selection failed'));
                //throw error;
            } else {
                resolve({
                    stars: `${result[0].num_stars}`,
                    reviews: `${result[0].num_reviews}`
                });
            }
        });
    });
}

/* inserts new star reviews for attractions in the database */
async function insertStarReview(attID, rating) {
    const oldNumbers = await getStarReview(attID);
    let x = Number.parseInt(oldNumbers.stars, 10) + rating;
    oldNumbers.reviews++;
    const query = `UPDATE attraction_reviews SET num_stars = ${x} WHERE id = '${attID}';`;
    const query2 =  `UPDATE attraction_reviews SET num_reviews = ${oldNumbers.reviews} WHERE id = '${attID}';`
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('review insertion failed'));
            }
        });
        connection.query(query2, (error, result) => {
            if (error) {
                reject(new Error('review insertion failed'));
            } else {
                resolve();
            }
        });
    });
}
/*responsible for generating the confirmation codes for reservations */
const generateConfirmation = () => {
    return `${Math.round(Math.random()*899+100)}-${Math.round(Math.random()*899+100)}`;
}
/* inserts reservation data into the reservations table in the database */
function insertRes(user, attraction, time, groupSize) {
    const confirmation = generateConfirmation();
    const query = `INSERT INTO reservations (user, attraction, time, group_size, confirmation) VALUES ('${user}', '${attraction}','${time}','${groupSize}','${confirmation}');`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                //reject(new Error('insertion failed'));
                throw error;
            } else {
                resolve(confirmation);
            }
        });
    });
}

/*goes through the reservations table, and finds all of the time slots the user
has placed a reservation. */
function findTimes(user) {
    const query = `SELECT time FROM reservations WHERE user = '${user}';`;
    let times = [];
    return new Promise((resolve, reject) => {
      connection.query(query, (error, result) => {
          if (error) {
              reject(new Error('selection failed for times'));
          } else {
              //console.log(`Result: ${result}`);
              result.forEach(entry => {
                  times.push(entry.time);
              });
              //console.log(times);
              resolve(times);
          }
      });  
    }); 
}

/* gernates an array of times that the user cannot reserve an attraction, based on what 
time slots they have already placed a reservation at. */
async function forbiddenTimes(user) {
    const times = await findTimes(user);
    const indexes = [];
    times.forEach(time => {
        const temp = info.reserveTimes.indexOf(time);
        for (let i = -3; i<4; i++) {
            indexes.push(`${temp+i}`);
        }
    });
    //console.log(indexes);
    return indexes;
}

/*generates the itinerary report for a user */
function generateReport(user) {
    const query = `SELECT attraction, time, confirmation FROM reservations WHERE user = '${user}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('selection of reservations failed'));
            } else {
                let array = [];
                result.forEach(row => {
                    let temp = {};
                    temp.att_id = `${row.attraction}`;
                    temp.attraction = `${info.attractions[row.attraction-1]}`;
                    temp.time = row.time;
                    temp.confirmation = `${row.confirmation}`;
                    array.push(temp);
                });
                resolve(array);
            }
        });
    });
}


function allAtts() {
    const query = `SELECT name, wait_time, is_closed FROM attractions;`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            } else {
                resolve(result);
            }
        });
    });
}
/*
function getRes(attID) {
    const query = `SELECT time, group_size, confirmation FROM reservations WHERE attraction = '${attID}';`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            } else {
                resolve(result);
            }
        })
    });
}
*/

/* gets the total number of reservations for the park stats report */
function getNumRes() {
    let i = 0;
    const query = `SELECT time FROM reservations;`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            } else {
                result.forEach(row => {
                    i++;
                });
                resolve(i);
            }
        })
    });
}
/*gets all the active reservations for a specific attraction, looked up by its ID# */
function getResById(attID) {
    let resArray = [];
    const query = `SELECT time, group_size, confirmation FROM reservations WHERE attraction = '${attID}'`;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                throw error;
            } else {
                result.forEach(row => {
                    resArray.push({
                        time: `${row.time}`,
                        groupSize: `${row.group_size}`,
                        confirmation: `${row.confirmation}`
                    });
                });
                resolve(resArray);
            }
        });
    });
}

async function awaitStats() {
    let finalObj = {};
    let temp = {};
    const x = await allAtts();
    let i = 1;
    x.forEach(row => {
        temp = {
            name: `${row.name}`,
            wait_time: `${row.wait_time}`,
            closed: `${row.is_closed}`
        };
        finalObj[`index${i}`] = temp;
        i++;
    });
    return finalObj;
}

/* generates an arrray of the star rating for every attraction */
const getAllReviews = () => {
    const query = `SELECT * FROM attraction_reviews;`;
    const revArray = [];
    return new Promise((resolve,reject) => {
        connection.query(query, (error, result) => {
            if (error) {
                reject(new Error('stars failed'));
            } else {
                result.forEach(row => {
                    let temp = {
                        attraction: `${row.id}`,
                        rating: `${Math.round(Number.parseInt(row.num_stars, 10) / Number.parseInt(row.num_reviews, 10))}`
                    };
                    revArray.push(temp);
                });
                resolve(revArray);
            }
        });
    });
}

/*exports the necessary functions so that they can be called by
app.js */
module.exports = {
    sendWaitTimes,
    insertUser,
    oneWaitTime,
    login,
    insertSession,
    returnSession,
    deleteSession,
    validateSession,
    getStarReview,
    insertStarReview,
    insertRes,
    forbiddenTimes,
    generateReport,
    changeTime,
    getEmail,
    checkIfAdmin,
    awaitStats,
    getNumRes,
    getResById,
    getAllReviews
};