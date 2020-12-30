
const sql = require('mysql');
const connection = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'data-password',
    database: 'scioto_ridge',
    insecureAuth: true
});

connection.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('Connected to Database!');
});

function selectWaitTimes() {
    const sql = "SELECT name, wait_time, att_id FROM attractions;";
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, result) => {
            if (result == undefined) {
                reject(new Error('rows is undefined'));
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
module.exports = {sendWaitTimes};








/*const statement = "INSERT INTO test_table (column1, column2) VALUES ('test', 'complete')";
connection.query(statement, (error, result) => {
    if (error) {
        throw error;
    }
    console.log('record inserted');
});*/
