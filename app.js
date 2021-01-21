const express = require('express');
const cookieParser = require('cookie-parser');
const database = require('./database');
const { response } = require('express');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser('multimedians21'));
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin','http://localhost:8080');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    response.setHeader('Access-Control-Allow-Headers','content-type');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.get('/', (request, response) => {
    response.send('Scioto Ridge API');
});
app.get('/test', (request, response) => {
    response.send('test complete');
});

app.post('/login', (request, response) => {
     console.log('login request');
     database.login(request.body.email, request.body.pass)
     .then(userID => {
         database.insertSession(userID)
         .then(session => {
             console.log('made it here');
             response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: false}).json({success: 'true'});
         })
         .catch(error => {
             console.log('something went wrong');
         })
     })
     .catch(error => {
         console.log('incorrect');
         //console.log(error);
         response.json({success: 'false'});
     });
  });
app.post('/login/new', (request, response) => {
    database.insertUser(request.body)
    .then(response.json({success: 'true'}))
    .catch(err => {
        console.log(err);
        response.json({sucess: 'false'});
    });
});
app.get('/login/v', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.returnSession(sess)
    .then(user => {
        user.session = 'true';
        console.log('made it this far');
        console.log(user);
        response.json(user);
    })
    .catch(error => {
        console.log('error somewhere');
        response.json({session: 'false'});
    })
});
app.get('/logout', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.deleteSession(sess)
    .then(z => {
        response.json({success: 'true'});
    })
    .catch(error => {
        console.log(error);
        response.json({success: 'false'});
    })
});

/*------ Start Protected Routes ------*/

/*app.use((request, response, next) => {
    if (false) {
        console.log('security checkpoint passed');
        next();
    } else {
        console.log('caught at security checkpoint');
        response.status(403).end();
    }
});*/


/*Test route -- remove later */
app.get('/cookie', (request, response) => {
    response.cookie('testCookie', 'value',{sameSite:'none', httpOnly: false}).json({cookie: 'set'});
});
app.get('/cookie/read', (request, response) => {
    console.log(request.cookies["testCookie"]);
    response.send('stupid');
});
/*--------------*/


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
});
app.post('/review/:id', (request, response) => {
    response.send('placeholder')
});
app.listen(PORT, () => {
    console.log(`Server Listening at ${PORT}`);
});