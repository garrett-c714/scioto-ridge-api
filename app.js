const express = require('express');
const cookieParser = require('cookie-parser');
const database = require('./database');
const info = require('./info');
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
         //console.log('made it this far');
         database.insertSession(userID)
         .then(session => {
             //console.log('made it here');
             response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: false}).json({success: 'true'});
         })
         .catch(error => {
             console.log('something went wrong');
         });
     })
     .catch(error => {
         console.log('incorrect');
         console.log(error);
         response.json({success: 'false'});
     });
  });
app.post('/login/new', (request, response) => {
    database.insertUser(request.body)
    .then(() => {
        database.login(request.body.email, request.body.password)
        .then((userID) => {
            database.insertSession(userID)
            .then(session => {
                console.log('made it here --- login/new');
                response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: false}).json({success: 'true'});
            })
            .catch(error => {
                console.log('error login/new -- insert session');
                console.log(error);
                response.json({success: 'false'});
            });
        })
        .catch(error => {
            console.log('error login/new -- login');
            console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(err => {
        console.log(err);
        response.json({success: 'false'});
    });
});
app.get('/login/v', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.returnSession(sess)
    .then(user => {
        user.session = 'true';
        //console.log('made it this far');
        //console.log(user);
        response.json(user);
    })
    .catch(error => {
        console.log('login not validated');
        response.json({session: 'false'});
    })
});
app.get('/email', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.validateSession(sess)
    .then(user => {
        database.getEmail(user)
        .then(email => {
            response.json({success: 'true',email:`${email}`});
        })
        .catch(error => {
            response.json({success: 'false'});
        })
    })
    .catch(error => {
        response.json({success: 'false'});
    });
})
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
app.post('/change-attraction', (request, response) => {
    const attraction = request.body.attraction;
    const newTime = request.body.time;
    const isClosed = request.body.isClosed;
    database.changeTime(attraction, newTime, isClosed)
    .then(() => {
        response.json({success: 'true'});
    })
    .catch(error => {
        console.log(error);
        response.json({success: 'false'});
    });
});


app.get('/review', (request, response) => {
    response.send('You have reached the review page.');
});
app.post('/review/:id', (request, response) => {
    const attID = request.params.id;
    const rating = request.body.rating;
    database.insertStarReview(attID, rating)
    .then(z => {
        response.json({success: 'true'})
    })
    .catch(error => {
        console.log('error');
        response.json({success: 'false'});
    })
});
app.get('/review/get/:id', (request, response) => {
    const attID = request.params.id;
    database.getStarReview(attID)
    .then(numbers => {
        numbers.success = 'true';
        response.json(numbers);
    })
    .catch(error => {
        console.log(error);
        response.json({success: 'false'});
    });
});
app.post('/reserve', (request, response) => {
    const sess = request.cookies["loginCookie"];
    const att = request.body.attraction;
    const time = request.body.time;
    const size = request.body.size;
    database.validateSession(sess)
    .then(user => {
        database.insertRes(user, att, time, size)
        .then(conf => {
            response.json({success: 'true',confirmation: `${conf}`});
        })
        .catch(error => {
            console.log(error);
            response.json({success: 'false'});
        });
    });
});
app.get('/reserve/forbidden', (request, response) => {
    const sess = request.cookies["loginCookie"];
    database.validateSession(sess)
    .then(user => {
        database.forbiddenTimes(user)
        .then(indexes => {
            let times = [];
            indexes.forEach(index => {
                if (info.reserveTimes[index] == undefined || times.includes(info.reserveTimes[index])) {
                    //do nothing
                } else {
                    times.push(info.reserveTimes[index]);
                }
            });
            response.json({success:'true',unavailableTimes: times});
        })
        .catch(error => {
            console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        console.log(error);
        response.json({success: 'false'});
    });
});

app.get('/report', (request, response) => {
    const sess = request.cookies["loginCookie"];
    database.validateSession(sess)
    .then(user => {
        database.generateReport(user)
        .then(array => {
            //console.log(array);
            response.json({success: 'true', reservations: array});
        })
        .catch(error => {
            console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        console.log(error);
        response.json({success: 'false'});
    })
});



app.listen(PORT, () => {
    console.log(`Server Listening at ${PORT}`);
});