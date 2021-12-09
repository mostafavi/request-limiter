/*!
 * Request limiter
 */


class RequestLimitter {
    constructor() {
        this.options = {
            // Set time window to 1 hour as default
            timeWindow: 60 * 60,

            // Set max request to 500 per time window as default 
            maxRequestThreshold: 500,

            // Set garbage collection schedule to every one minute 
            scheduledGarbageCollecting: 60 * 1000
        }
        // In memory refrence
        this.ipTable = []
    }

    // Check maximum request threshold
    checkMaxThreshold = (key) => {
        if (this.ipTable[key]) {
            if (this.ipTable[key].numberOfRequests < this.options.maxRequestThreshold) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    }

    // Store in memory
    storeInMemory = (key) => {
        // Current UNIX time in seconds
        let now = Math.round(Date.now() / 1000)

        // Time To Live
        let TTL = this.options.timeWindow

        // Check if ley exist and defined
        if (this.ipTable[key]) {

            // Time that passed from creation of key
            let passedTime = now - this.ipTable[key].openedTimeWindow

            TTL = this.options.timeWindow - passedTime

            // check TTL and create new TTL if it passed
            if (TTL > 0) {
                this.ipTable[key].numberOfRequests++
            } else {
                this.ipTable[key] = {
                    openedTimeWindow: now,
                    numberOfRequests: 1
                }
            }

            return TTL

        } else {
            this.ipTable[key] = {
                openedTimeWindow: now,
                numberOfRequests: 1
            }
            return TTL
        }
    }
    // Reset table data
    resetTable = () => {
        this.ipTable = []
    }
    // Delete unused keys from memory
    garbageCollector = () => {
        // Current UNIX time in seconds
        let now = Math.round(Date.now() / 1000)

        // Check table for dead keys and delete them to free up memory
        for (const key in this.ipTable) {
            if (now - this.ipTable[key].openedTimeWindow >= this.options.timeWindow + 1) {
                console.log("deleted " + key)
                delete this.ipTable[key]
            }
        }
    }

    // Initialize the parameters
    initialize = (options) => {
        this.options.timeWindow = options.timeWindow ? options.timeWindow : this.options.timeWindow
        this.options.maxRequestThreshold = options.maxRequestThreshold ? options.maxRequestThreshold : this.options.maxRequestThreshold
        this.options.scheduledGarbageCollecting = options.scheduledGarbageCollecting ? options.scheduledGarbageCollecting : this.options.scheduledGarbageCollecting

        // run garbage collector
        setInterval(this.garbageCollector, this.options.scheduledGarbageCollecting)
    }

    // Initialize middleware function
    limit = (req, res, next) => {
        let key = req.ip
        let cooldown = this.storeInMemory(key)

        if (this.checkMaxThreshold(key)) {
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

}

module.exports = RequestLimitter