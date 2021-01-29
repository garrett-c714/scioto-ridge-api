const express = require('express');
const cookieParser = require('cookie-parser');
const database = require('./database');
const info = require('./info');
const { response } = require('express');
/*Repository Link for code evaluation and grading purposes: 
https://github.com/garrett-c714/API   */

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser('multimedians21'));

/*Sets the preflight request headers */
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin','https://efctsmultimedians.com');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    response.setHeader('Access-Control-Allow-Headers','content-type');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.get('/', (request, response) => {
    response.send('Scioto Ridge API');
});

/*Below, each function is a different route that can be accessed. 
The routes are URL based, and each performs different action in database.js,
which accessed the database through SQL queries*/



/*Login Routes  */
/* ------------ */


/*The login functions look up a user with their email and password in the database, 
and if the information is valid, the response is sent back with a cookie to maintain the
user state until they log out. */
app.post('/login', (request, response) => {
     console.log('login request');
     const pass = info.encoder(request.body.pass);
     database.login(request.body.email, pass)
     .then(userID => {
         //console.log('made it this far');
         database.insertSession(userID)
         .then(session => {
             //console.log('made it here');
             response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: true, secure: true}).json({success: 'true'});
         })
         .catch(error => {
             console.log('something went wrong');
             response.json({success: 'false'});
         });
     })
     .catch(error => {
         response.json({success: 'false'});
     });
  });

  /*The purpose of this route is to insert new users into the databse. Only one account
  can be created per email. */
app.post('/login/new', (request, response) => {
    const pass = info.encoder(request.body.password);
    database.insertUser(request.body.fName, request.body.lName, request.body.email, pass)
    .then(() => {
        database.login(request.body.email, pass)
        .then((userID) => {
            database.insertSession(userID)
            .then(session => {
                //console.log('made it here --- login/new');
                response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: true, secure: true}).json({success: 'true'});
            })
            .catch(error => {
                //console.log('error login/new -- insert session');
                //console.log(error);
                response.json({success: 'false'});
            });
        })
        .catch(error => {
            //console.log('error login/new -- login');
            //console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(err => {
        //console.log(err);
        response.json({success: 'false'});
    });
});

/*This route verifies that there is an active session in the sessions table,
through the session ID present on a cookie */
app.get('/login/v', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.returnSession(sess)
    .then(user => {
        user.session = 'true';
        response.json(user);
    })
    .catch(error => {
        //console.log('login not validated');
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

/*Logs out the user by deleting their session in the sessions table */
app.get('/logout', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.deleteSession(sess)
    .then(z => {
        response.json({success: 'true'});
    })
    .catch(error => {
        //console.log(error);
        response.json({success: 'false'});
    })
});

/*Administrator accounts are validated in the "admins" table, and the admin routes
can only be accessed by an admin */
app.post('/admin-login', (request,response) => {
    const pass = info.encoder(request.body.pass);
    database.login(request.body.email, pass)
    .then(userID => {
        database.checkIfAdmin(userID)
        .then(userID => {
            database.insertSession(userID)
            .then(session => {
                response.cookie('loginCookie', `${session}`,{sameSite:'none', httpOnly: true, secure: true}).json({success: 'true'}); 
            })
            .catch(error => {
                //console.log('error with session');
                response.json({success: 'false'});
            });
        })
        .catch(error => {
            //console.log('not an admin');
            response.json({success: 'false'});
        })
    })
    .catch(error => {
        //console.log('error 1');
        response.json({success: 'false'});
    });
});
app.get('/admin/v', (request, response) => {
    const sess = request.cookies["loginCookie"];
    database.validateSession(sess)
    .then(user => {
        database.checkIfAdmin(user)
        .then(() => {
            database.awaitStats()
            .then(data => {
                data.success = 'true';
                response.json(data);
            })
            .catch(error => {
                //console.log(error);
                response.json({success: 'false'});
            })
        })
        .catch(error => {
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        response.json({success: 'false'});
    });
});
/* End of login routes */
/* -------------------*/



app.get('/totalres', (request, response) => {
    const sess = request.cookies['loginCookie'];
    database.validateSession(sess)
    .then(user => {
        database.checkIfAdmin(user)
        .then(() => {
            database.getNumRes()
            .then(number => {
                response.json({total: `${number}`});
            })
            .catch(error => {
                //console.log(error);
                response.json({success: 'false'});
            }); 
        })
        .catch(error => {
            //console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        //console.log(error);
        response.json({success: 'false'});
    });
});
app.get('/getres/:id', (request, response) => {
    const sess = request.cookies['loginCookie'];
    const attID = request.params.id;
    database.validateSession(sess)
    .then(user => {
        database.checkIfAdmin(user)
        .then(() => {
            database.getResById(attID)
            .then(array => {
                response.json({reservations: array});
            })
            .catch(error => {
                //console.log(error);
                response.json({success: 'false'});
            }); 
        })
        .catch(error => {
            //console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        //console.log(error);
        response.json({success: 'false'});
    });
});

/*Returns the attraction information like wait times */
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

/*admin route -- allows the changing of attraction data in the database */
app.post('/change-attraction', (request, response) => {
    const attraction = request.body.attraction;
    const newTime = request.body.time;
    const isClosed = request.body.isClosed;
    database.changeTime(attraction, newTime, isClosed)
    .then(() => {
        response.json({success: 'true'});
    })
    .catch(error => {
        //console.log(error);
        response.json({success: 'false'});
    });
});

/*inserts new star reviews into the database for the attractions */
app.post('/review', (request, response) => {
    const attID = Number.parseInt(request.body.id, 10);
    const rating = Number.parseInt(request.body.rating, 10);
    database.insertStarReview(attID, rating)
    .then(z => {
        response.json({success: 'true'})
    })
    .catch(error => {
        //console.log('error');
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
        //console.log(error);
        response.json({success: 'false'});
    });
});
app.get('/stars',(request, response) => {
    database.getAllReviews()
    .then(array => {
        response.json({ratings: array});
    });
});

/*This route handles new reservations from users. The infromation from the frontend 
is served in the request body, which is then passed into database.js and stored 
in the reservations table */
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
            //console.log(error);
            response.json({success: 'false'});
        });
    });
});

/*This route returns a list of all of the times that a user cannot reserve, since reservations
cannot be within 30 minutes of each other. */
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
            //console.log(error);
            response.json({success: 'false'});
        });
    })
    .catch(error => {
        //console.log(error);
        response.json({success: 'false'});
    });
});

/*This generate the itinerary report for a use, the users data is able to be 
looked up from the loginCookie, and then the itenerary report can be 
generated */

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
        //console.log(error);
        response.json({success: 'false'});
    })
});


/*Starts the server. If running locally the port is 5000, and when running on the 
Heroku service, it binds to the PORT environment variable */
app.listen(PORT, () => {
    console.log(`Server Listening at ${PORT}`);
});