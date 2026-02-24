const {
    QUERY_INTERNAL_TYPE,
    QT,
} = require('../symbol-lockup/symbols');


class TemplateCount {

    get[QUERY_INTERNAL_TYPE](){ return QT.template };

    #idx = 0;
    #values = [];

    idx(value) {
        this.#values.push(value);
        return ++this.#idx;
    }

    getLiterals() {
        return this.#values;
    }
}

module.exports = {TemplateCount};