const { T } = require('../util/types');

const {
    IR,
    isQuery,
    isValue,
    isTable,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {Column} = require('../lexicalStructures/column');

const {QuerySyntaxError} = require('../util/error');

const {WhereClause} = require('../clauseStructures/where');

const {Table} = require('../lexicalStructures/table');

class JoinClause {
    #table;
    #type;
    #whereClause = new WhereClause();

    constructor(table, type) {
        this.#table = ((isTable(table)) || (isQuery(table))) ? table : new Table(table);
        if (!Object.values(QueryGrammar.joinTypes).includes(type)) throw new QuerySyntaxError(`type must be in: (${Object.values(QueryGrammar.joinTypes).join(', ')})`);
        this.#type = type;
    }

    get whereClause() {
        return this.#whereClause;
    }

    on(left, operator, right) {
        return this.#on(left, operator, right, QueryGrammar.logicalOperator.and);
    }

    onOr(left, operator, right) {
        return this.#on(left, operator, right, QueryGrammar.logicalOperator.or);
    }

    #on(left, operator, right, type) {

        if(T.v.callable.func(left)){
            left(this.#whereClause);
            return this;
        }

        if (right === undefined) {
            right = operator;
            operator = '=';
        }
        if (!isValue(right) && T.v.filledString.func(right)) right = new Column(right);
        if (type === QueryGrammar.logicalOperator.and) {
            this.#whereClause.where(left, operator, right);
        }
        else if (type === QueryGrammar.logicalOperator.or) {
            this.#whereClause.orWhere(left, operator, right);
        }
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator)})`);
        return this;
    }

    onGroup(callBack) {
        this.#whereClause.whereGroup(callBack);
        return this;
    }

    onGroupOr(callBack) {
        this.#whereClause.orWhereGroup(callBack);
        return this;
    }

    //PLACE CHANGE
    toInstruction(countObj) {
        const isCross = this.#type === QueryGrammar.joinTypes.crossJoin;

        if (this.#whereClause.isEmpty() && !isCross) throw new QuerySyntaxError('on clause not found.');
        if (!this.#whereClause.isEmpty() && isCross) throw new QuerySyntaxError('on clause in cross join is bad syntax.');

        const str = [];
        str.push(this.#type);
        str.push(this.#table.toInstruction(countObj, IR.subQuery));

        if (!isCross) {
            str.push('ON');
            str.push(this.#whereClause.toInstruction(true, countObj));
        }

        return str.join(' ');
    }
    //
}

module.exports = { JoinClause };