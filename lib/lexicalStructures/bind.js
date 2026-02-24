const {
    QUERY_VALUE_TYPE,
    QT,
    isTemplateCount
} = require('../symbol-lockup/symbols');

class Bind {

    get[QUERY_VALUE_TYPE]() { return QT.bind }

    #value;

    constructor(value) {
        if (value === undefined) throw new TypeError('value can not be undefined.');
        this.#value = value;
    }

    //PLACE CHANGE
    toInstruction(count) {
        if (!(isTemplateCount(count))) throw new TypeError('Bind count is required for compilation.');
        return `$${count.idx(this.#value)}`;
    }
}

module.exports = { Bind };