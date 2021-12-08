/*!
 * Request limiter
 */

'use strict';

/**
 * Module dependencies.
 */


// Set time window to 1 hour as default
var timeWindow = 15

// Set max request to 500 per time window as default 
var maxRequestThreshold = 2

// In memory refrence
var ipTable = []

// Set garbage collection schedule to every one minute 
var scheduledGarbageCollecting = 60 * 1000


// Initialize middleware function
function requestLimit(req, res, next) {

    let key = requestIPKey(req)
    let cooldown = storeInMemory(key)

    if (checkMaxThreshold(key)) {
        next()
    } else {
        let err = {
            message: "Too many requests",
            retryAfter: cooldown
        }
        res.header("Retry-After", cooldown)
        res.status(429).json(err)
    }
}


// Generate key to store in memory
function requestIPKey(req) {
    // check ip forwarded by proxy first
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    return ip
}

// Check maximum request threshold
function checkMaxThreshold(key) {

    if (ipTable[key]) {
        if (ipTable[key].numberOfRequests < maxRequestThreshold) {
            return true
        } else {
            return false
        }
    } else {
        return true
    }
}

// Store in memory
function storeInMemory(key) {
    // Current UNIX time in seconds
    let now = Math.round(Date.now() / 1000)

    // Time To Live
    let TTL = timeWindow

    // Check if ley exist and defined
    if (ipTable[key]) {

        // Time that passed from creation of key
        let passedTime = now - ipTable[key].openedTimeWindow

        TTL = timeWindow - passedTime

        // check TTL and create new TTL if it passed
        if (TTL > 0) {
            ipTable[key].numberOfRequests++
        } else {
            ipTable[key] = {
                openedTimeWindow: now,
                numberOfRequests: 1
            }
        }

        return TTL

    } else {

        ipTable[key] = {
            openedTimeWindow: now,
            numberOfRequests: 1
        }

        return TTL
    }
}

// Delete unused keys from memory
function garbageCollector() {

    // Current UNIX time in seconds
    let now = Math.round(Date.now() / 1000)

    // Check table for dead keys and delete them to free up memory
    for (const key in ipTable) {
        if (now - ipTable[key].openedTimeWindow >= timeWindow + 1) {
            delete ipTable[key]
        }
    }

}

setInterval(garbageCollector, scheduledGarbageCollecting)

module.exports = requestLimit