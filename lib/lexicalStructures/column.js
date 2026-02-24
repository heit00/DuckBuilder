const { T } = require('../util/types');

const {
    QUERY_VALUE_TYPE,
    QT,
} = require('../symbol-lockup/symbols');

const {QueryGrammar }= require('../grammar/grammar');
const {QuerySyntaxError } = require('../util/error');

class Column {
    get [QUERY_VALUE_TYPE]() { return QT.column; }

    #name;
    #alias;
    #table

    constructor(name, alias = undefined) {

        if (!T.v.filledString.func(alias) && alias !== undefined) throw new TypeError('alias must be undefined or a string.');
        if (typeof name !== 'string' || name.trim().length === 0) throw new QuerySyntaxError('column must be an string.');
        const parts = name.split('.');
        if (parts.length > 2) throw new QuerySyntaxError('namespace table must have 1 dot.');

        this.#table = parts.length > 1 ? parts[0] : undefined;
        this.#name = parts.length > 1 ? parts[1] : parts[0];
        this.#alias = alias;

    }

    hasAlias() {
        return this.#alias !== undefined;
    }

    get alias() {
        return this.#alias;
    }

    get name() {
        return this.#name;
    }

    get table() {
        return this.#table;
    }

    //PLACE CHANGE
    toInstruction() {

        const str1 = this.#name !== '*' ? `"${this.#name}"` : this.#name;
        const str2 = this.#table ? `"${this.#table}"` : '';
        const str3 = this.#alias ? ` ${QueryGrammar.extra.as} "${this.#alias}"` : '';

        const finalStr = `${str2.trim().length > 0 ? str2 + '.' : ''}${str1}${str3}`;
        return finalStr;
    }
}

module.exports = { Column };