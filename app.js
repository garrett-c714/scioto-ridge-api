const express = require('express');
const app = express();
const sql = require('mysql');
const database = require('./database');

app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin','*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    response.setHeader('Access-Control-Allow-Headers','content-type');
    next();
});

app.get('/', (request, response) => {
    response.send('Scioto Ridge API');
});

app.get('/attractions', (request, response) => {
    database.sendWaitTimes()
    .then(data => {
        response.json(data);
    });
});

app.get('/review', (request, response) => {
    response.send('You have reached the review page.');
})

app.route('/login')
  .get((request, response) => {
      response.send('Login Page GET');
  })
  .post((request, response) => {
      response.send('Login Page POST');
  });

app.listen(3000, () => {
    console.log('Server Listening at http://127.0.0.1:3000');
});

