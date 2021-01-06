const http = require('http');
const sql = require('mysql');
const database = require('./database');
const bodyParser = require('body-parser');
const hostname = '127.0.0.1';
const port = 8000;

const requestListener = (request, response) => {
    response.setHeader('Content-Type', 'text/plain');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    switch (request.url) {
        case "/login":
            switch (request.method){
                case "GET":
                    response.setHeader('Content-Type', 'application/json');
                    response.writeHead(200);
                    response.end(JSON.stringify({hello: 'yes'}));
                    break;
                case "POST":
                    response.setHeader('Content-Type', 'application/json');
                    response.writeHead(200);
                    console.log(request.body);
                    response.end();
                    break;
                default: 
                    response.writeHead(404);
                    response.end('used method not found');
                    break;
            }
            break;
            
        case "/attractions":
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(200);
            database.sendWaitTimes()
            .then(data => {
                response.end(JSON.stringify(data));
            })
            .catch(err => {
                response.write('error');
                response.end();
            });
            break;

        case "/review":
            response.writeHead(200);
            response.end('You have reached the review page');
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