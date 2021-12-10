/*!
 * Request limiter
 */


class RequestLimitter {
    constructor() {
        let hourToSeconds = 60 * 60
        let minuteToMiliseconds = 60 * 1000

        // Initializer flag, it will be true if initializer function correctly load parameters
        this.isInitialized = false

        // Weights Table
        this.weightsTable = []

        // Predefined load patterns
        this.load = {
            // 100 Request Per Hour
            LOW: { timeWindow: hourToSeconds, maxRequestThreshold: 100, scheduledGarbageCollecting: minuteToMiliseconds * 2 },
            // 500 Request Per Hour 
            MEDIUM: { timeWindow: hourToSeconds, maxRequestThreshold: 500, scheduledGarbageCollecting: minuteToMiliseconds },
            // 1000 Request Per Hour
            HIGH: { timeWindow: hourToSeconds, maxRequestThreshold: 1000, scheduledGarbageCollecting: minuteToMiliseconds * 0.5 }
        }

        // Create options
        this.options = Object.create(null)

        // Garbage Collector Refrence
        this.garbageCollectorRefrence = Object.create(null)

        // In memory refrence
        this.ipTable = []


    }

    // Initialize the parameters
    initialize = (options) => {

        // load options
        this.options.timeWindow = options.timeWindow ? options.timeWindow : this.options.timeWindow
        this.options.maxRequestThreshold = options.maxRequestThreshold ? options.maxRequestThreshold : this.options.maxRequestThreshold
        this.options.scheduledGarbageCollecting = options.scheduledGarbageCollecting ? options.scheduledGarbageCollecting : this.options.scheduledGarbageCollecting

        // run garbage collector
        this.garbageCollectorRefrence = setInterval(this.garbageCollector, this.options.scheduledGarbageCollecting)
        this.isInitialized = true
    }

    // Set weight for end points
    setWeight = (endpoint, weight) => {
        this.weightsTable[endpoint] = weight
    }

    // Get weight for end points
    getWeight = (endpoint) => {
        if (typeof (this.weightsTable[endpoint]) == 'number') {
            return parseInt(this.weightsTable[endpoint])
        } else {
            return 1
        }
    }

    // Check maximum request threshold
    checkMaxThreshold = (key) => {
        if (this.ipTable[key]) {
            if (this.ipTable[key].numberOfRequests <= this.options.maxRequestThreshold) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    }

    // Store in memory
    storeInMemory = (key, weight) => {
        // Current UNIX time in seconds
        let now = Math.round(Date.now() / 1000)

        // Time To Live
        let TTL = this.options.timeWindow

        // Check if ley exist and defined
        if (this.ipTable[key]) {

            // Time that passed from creation of key
            let passedTime = now - this.ipTable[key].openedTimeWindow

            // Calculate Time To Live
            TTL = this.options.timeWindow - passedTime

            // check TTL and create new TTL if it passed
            if (TTL > 0) {
                this.ipTable[key].numberOfRequests += weight
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



    // Stop the garbage collection timer
    stopGarbageCollector = () => {
        clearInterval(this.garbageCollectorRefrence);
    }

    // Express middleware function
    limit = (req, res, next) => {
        if (this.isInitialized) {
            let url = req.originalUrl
            let key = req.ip
            let cooldown = this.storeInMemory(key, this.getWeight(url))
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
        } else {
            let err = {
                message: "Limiter not initialized"
            }
            res.status(500).json(err)
        }
    }

}

module.exports = RequestLimitter