const http = require('http');
const ridesMod = require('./rides');
const sql = require('mysql');
const database = require('./database');
const { send } = require('process');
const hostname = '127.0.0.1';
const port = 8000;

const requestListener = (request, response) => {
    response.setHeader('Content-Type', 'text/plain');
    switch (request.url) {
        case "/login":
            response.writeHead(200);
            response.end('You have reached the login page');
            break;
        case "/attractions":
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(200);
            database.send()
            .then(result => {
                //console.log(result);
                response.write(JSON.stringify(result));
                response.end();
            })
            .catch(error => {
                console.log(error);
                response.write('failure');
                response.end();
            })
            break;
        case "/review":
            response.writeHead(200);
            response.end('You have reached the reivew page');
            break;
        case "/db-input":
            response.writeHead(200);
            response.end('You have reached the database input zone. This will be method POST in the future.');
            break;
        default: 
            response.writeHead(404);
            response.end('Server responded with status code: 404 (not found)');
    }
}
const server = http.createServer(requestListener);
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});