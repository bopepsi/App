class HttpError extends Error {
    constructor(message, errorCode) {
        super(message); // Add a msg prop
        this.code = errorCode;
    }
}

module.exports = HttpError;