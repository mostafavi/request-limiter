/*!
 * Request limiter
 */

const http = require("http");
const express = require('express')
const app = express()

// Load module
const RequestLimitter = require('./middleware/request-limiter/request-limiter')
let rl = new RequestLimitter()


// Set general headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Authorization, X-Custom-Header, Origin, X-Requested-With, Content-Type, Accept, Cache-Control"
    );
    res.header(
        "Access-Control-Expose-Headers",
        "Authorization, Content-Type, Allow, X-Response-Time, Cache-Control"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE");
        return res.status(200).json({});
    }
    next();
});

// Trust the proxy if it's behind
app.set('trust proxy', true)


// load env vars
let port = process.env.PORT || 4000
let load = process.env.LOAD || 'LOW' // LOW: 100 MEDIUM: 500 HIGH: 1000  request per hour
let host = process.env.HOST || '0.0.0.0' // Host IP

// Initialize max load to lowest request rate
rl.initialize(rl.load[load.toUpperCase()])

// Set weights for deferent test endpoints (Example)
rl.setWeight('/1', 1);
rl.setWeight('/2', 2);
rl.setWeight('/5', 5);


// use limiter middleware
app.use(rl.limit)

app.get('*', function (req, res) {
    res.status(200).json({ message: 'OK' })
})

// Create and start server
server = http.createServer(app);
server.listen(port, host, () => {
    console.log(`API Service listening to port : ${port}`)
    console.log(`ON : ${host}`)
    console.log(`Loaded load profile:  ${load}`)
});