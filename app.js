const http = require('http');
const hostname = '127.0.0.1';
const port = 8080;
const requestListener = (request, response) => {
    response.setHeader('Content-Type', 'text/plain');
    switch (request.url) {
        case "/login":
            response.writeHead(200);
            response.end('You have reached the login page');
            break;
        case "/rides":
            response.writeHead(200);
            response.end('You have reached the rides page');
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