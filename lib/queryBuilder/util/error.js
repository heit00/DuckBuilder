class QuerySyntaxError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QuerySyntaxError'
    }
}

module.exports = { QuerySyntaxError };