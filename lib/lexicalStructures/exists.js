const { T } = require('../util/types');

const {
    IR,
    isQuery,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {QuerySyntaxError} = require('../util/error');

class Exists {
    #type
    #query;

    constructor(query, type) {
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new QuerySyntaxError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        if (!(isQuery(query))) throw new TypeError('query must be a instance of Query class.');
        this.#type = type;
        this.#query = query;
    }

    toInstruction(first, count) {
        if (typeof first !== 'boolean') throw new TypeError('first must be a boolean.');
        const operator = !first ? `${this.#type} ` : '';
        const exists = QueryGrammar.clauses.exists;
        const subQuery = this.#query.toInstruction(count, IR.cte);

        return `${operator}${exists} ${subQuery}`;
    }
}

module.exports = { Exists };