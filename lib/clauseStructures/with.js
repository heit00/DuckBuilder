const { T } = require('../util/types');

const {
    QUERY_STRUCTURE_TYPE,
    QT,
    IR,
    isQuery,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {QuerySyntaxError} = require('../util/error');

class With {

    get [QUERY_STRUCTURE_TYPE]() { return QT.with; }

    #query;
    #alias;

    constructor(query, alias) {
        if (!(isQuery(query))) throw new TypeError('query must be a instance of Query class.');
        if (!T.v.filledString.func(alias)) throw new TypeError('alias must be a string.');
        this.#query = query;
        this.#alias = alias;
    }

    toInstruction(count) {
        const alias = this.#alias;
        const subQuery = this.#query.toInstruction(count, IR.cte);
        return `${alias} ${QueryGrammar.extra.as} ${subQuery}`;
    }
}

class WithClause {
    #withArray = [];

    add(qb, alias) {
        const w = new With(qb, alias);
        this.#withArray.push(w);

        return this;
    }

    isEmpty() {
        return this.#withArray.length === 0;
    }

    remove(idx) {
        if (!Number.isInteger(idx) || idx < 0) throw new TypeError('idx must be a valid integer >=0.');
        if (idx > this.#withArray.length - 1) throw new RangeError('idx not in range of array.');
        else this.#withArray.splice(idx, 1);

        return this;
    }

    toInstruction(count) {
        if (this.#withArray.length === 0) throw new QuerySyntaxError('array of with is empty.');
        const withStr = this.#withArray.map(el => el.toInstruction(count)).join(', ');
        return withStr;
    }
}

module.exports = { WithClause };