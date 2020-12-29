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

async function waitTimesAll() {
    const statement = "SELECT name, wait_time, att_id FROM attractions;";
    let response = {};
    connection.query(statement , (error,result) => {
        if (error) {
            throw error;
        }
        result.forEach(entry => {
            let indexName = `index${entry.att_id}`;
            response[indexName] = {
                name: `${entry.name}`,
                waitTime: `${entry.wait_time}`,
            };
        });
        //console.log(JSON.stringify(response));
        console.log(response);
    });
    return response;
}
module.exports = {waitTimesAll};








/*const statement = "INSERT INTO test_table (column1, column2) VALUES ('test', 'complete')";
connection.query(statement, (error, result) => {
    if (error) {
        throw error;
    }
    console.log('record inserted');
});*/
