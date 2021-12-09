const http = require("http");
const express = require('express')
const app = express()

const RequestLimitter = require('./middleware/request-limiter/request-limiter')

let rl = new RequestLimitter()

rl.initialize({
    timeWindow: 15,
    maxRequestThreshold: 5
})

app.set('trust proxy', true)

app.use(rl.limit)

app.get('/', function (req, res) {
    res.send('Hello World')
})


server = http.createServer(app);
port = 3000;

server.listen(port, '0:0:0:0:0:0:0:0', () => {
    console.log(`API Service listening to port : ${port}`);
});