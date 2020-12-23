const sql = require('mysql');

const connection = sql.createConnection({
    host: 'localhost',
    user: 'user-name',
    password: 'pass-word'
});

connection.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('Connected to Database!');
});

