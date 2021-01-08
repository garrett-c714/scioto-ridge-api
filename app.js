const express = require('express');
const app = express();
const sql = require('mysql');
const database = require('./database');
const PORT = process.env.PORT || 5000;

app.use(express.json());
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
app.get('/attractions/:id', (request,response) => {
    database.oneWaitTime(Number.parseInt(request.params.id, 10))
    .then(data => {
        response.json({
            id: `${data[0].att_id}`,
            name: `${data[0].name}`,
            waitTime: `${data[0].wait_time}`
        });
    })
    .catch(err => {
        response.send(err);
    })
});

app.get('/review', (request, response) => {
    response.send('You have reached the review page.');
})

app.route('/login')
  .get((request, response) => {
      response.send('Login Page GET');
  })
  .post((request, response) => {
      console.log(request.body);
      response.json({cool: 'beans'});
  });

  app.post('/login/new', (request, response) => {
    database.insertUser(request.body)
    .then(response.json({success: 'true'}))
    .catch(err => {
        console.log(err);
        response.json({sucess: 'false'});
    });
  });

app.listen(PORT, () => {
    console.log(`Server Listening at ${PORT}`);
});

