const RequestLimitter = require('./request-limiter');
let r = new RequestLimitter()
r.initialize(r.load.LOW)

beforeEach(() => {
    r.resetTable()
})

// Write the key and check the TTL
test('Send new request and check the status', () => {
    expect(r.storeInMemory("127.0.0.1", 1)).toBe(r.options.timeWindow);
});

// Write the key less that threshold and check the request validity
test('Send normal request and check the functionality', () => {
    for (let i = 0; i < r.options.maxRequestThreshold; i++) {
        r.storeInMemory("127.0.0.1", 1)
    }
    expect(r.checkMaxThreshold("127.0.0.1")).toBe(true);
});

// Write the key less that threshold and check the request validity
test('Weight test on endpoints', () => {
    for (let i = 0; i < r.options.maxRequestThreshold; i++) {
        r.storeInMemory("127.0.0.1", 2)
    }
    expect(r.checkMaxThreshold("127.0.0.1")).toBe(false);
});

// Write the key by max threshold and check the request validity
test('Send maximum request and check the functionality', () => {
    for (let i = 0; i < r.options.maxRequestThreshold + 1; i++) {
        r.storeInMemory("127.0.0.1", 1)
    }
    expect(r.checkMaxThreshold("127.0.0.1")).toBe(false);
});

afterAll(() => {
    r.stopGarbageCollector()
})


