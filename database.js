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

