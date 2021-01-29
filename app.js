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
    response.setHeader('Access-Control-Allow-Origin','https://efctsmultimedians.com');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    response.setHeader('Access-Control-Allow-Headers','content-type');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.get('/', (request, response) => {
    response.send('Scioto Ridge API');
});

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
                console.log(error);
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

/*   Admin Routes   */
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
        //console.log(error);
        response.json({success: 'false'});
    });
});


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



app.listen(PORT, () => {
    console.log(`Server Listening at ${PORT}`);
});