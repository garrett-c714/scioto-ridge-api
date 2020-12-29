const http = require('http');
const ridesMod = require('./rides');
const sql = require('mysql');
const database = require('./database');
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
            //database.waitTimesAll();
            async function send() {
                const x = await database.waitTimesAll();
                console.log(`function returned: ${x}`);
                response.write('so dumb');
                response.end();
            }
            send();
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