const { T } = require('../util/types');

const {
    IR,
    isValue,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {Column} = require('../lexicalStructures/column');

const {QuerySyntaxError} = require('../util/error');

const {Bind} = require('../lexicalStructures/bind');

class BetWeen {
    #type;
    #left;
    #min;
    #max;


    #normalize(val) {

        if (
            isValue(val)
        ) {
            if (typeof val.hasAlias === 'function') if (val.hasAlias()) throw new QuerySyntaxError('can not has alias in between expression.');
            return val;
        }
        return new Bind(val);
    }

    constructor(left, [min, max] = [], type) {

        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new QuerySyntaxError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        if (T.v.filledString.func(left)) left = new Column(left);
        left = this.#normalize(left);
        //else if (!(left instanceof Column)) throw new TypeError('left must be a column or a string.');
        //if(left.hasAlias()) throw new QuerySyntaxError('columns can not has alias in between expression.');

        this.#type = type;
        this.#left = left;
        this.#min = this.#normalize(min);
        this.#max = this.#normalize(max);
    }

    toInstruction(first, count) {
        if (typeof first !== 'boolean') throw new TypeError('first must be a boolean.');
        const operator = !first ? `${this.#type} ` : '';
        const verb = QueryGrammar.clauses.between;
        const and = QueryGrammar.logicalOperator.and;

        const finalStr = `${operator}${this.#left.toInstruction(count, IR.cte)} ${verb} ${this.#min.toInstruction(count, IR.cte)} ${and} ${this.#max.toInstruction(count, IR.cte)}`;
        return finalStr;
    }
}

module.exports = { BetWeen };