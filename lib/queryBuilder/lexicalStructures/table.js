const { T } = require('../util/types');

const {
    QUERY_STRUCTURE_TYPE,
    QT,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {QuerySyntaxError} = require('../util/error');

class Table {
    get [QUERY_STRUCTURE_TYPE]() { return QT.table; }

    #name;
    #alias
    constructor(name, alias = undefined) {
        if (!T.v.filledString.func(alias) && alias !== undefined) throw new TypeError('alias must be undefined or a string.');
        if (typeof name !== 'string' || name.trim().length === 0) throw new QuerySyntaxError('column must be an string.');
        this.#name = name;
        this.#alias = alias;//
    }

    hasAlias() {
        return this.#alias !== undefined;
    }

    toInstruction() {
        const str1 = `"${this.#name}"`;
        const str3 = this.#alias ? ` ${QueryGrammar.extra.as} "${this.#alias}"` : '';

        const finalStr = `${str1}${str3}`;
        return finalStr;
    }
}

module.exports = { Table };