const { T } = require('../util/types');

const {
    isValue,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {QuerySyntaxError} = require('../util/error');

const {Expression, InExpression} = require('../lexicalStructures/expression');

const {Bind} = require('../lexicalStructures/bind');

const {BetWeen} = require('../lexicalStructures/between');

const {Exists} = require('../lexicalStructures/exists');


class WhereClause {

    #type;
    #expressions = [];

    constructor(type = QueryGrammar.logicalOperator.and) {
        if (typeof type === 'string') type = type.toUpperCase();
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        this.#type = type;
    }

    isEmpty() {
        return this.#expressions.length <= 0;
    }

    //
    where(left, operator, right) {
        return this.#add(left, operator, right, QueryGrammar.logicalOperator.and);
    }
    //
    orWhere(left, operator, right) {
        return this.#add(left, operator, right, QueryGrammar.logicalOperator.or);
    }

    #add(left, operator, right, type) {

        if (right === undefined) {
            right = operator;
            operator = '=';
        }

        if (!isValue(right)) right = new Bind(right); //
        //IF is not a object o string the error will exploood in new Expression();

        const exp = new Expression(left, operator, right, type);
        this.#expressions.push(exp);
        return this;

    }

    whereIn(left, right) {
        return this.#addIn(left, right, false, QueryGrammar.logicalOperator.and);
    }

    orWhereIn(left, right) {
        return this.#addIn(left, right, false, QueryGrammar.logicalOperator.or);
    }

    whereNotIn(left, right) {
        return this.#addIn(left, right, true, QueryGrammar.logicalOperator.and);
    }

    orWhereNotIn(left, right) {
        return this.#addIn(left, right, true, QueryGrammar.logicalOperator.or);
    }

    #addIn(left, right, isNot = false, type) {
        const exp = new InExpression(left, right, type, isNot);
        this.#expressions.push(exp);
        return this;
    }

    //
    whereBetween(left, [min, max]) {
        return this.#addBetween(left, [min, max], QueryGrammar.logicalOperator.and);
    }

    //
    orWhereBetween(left, [min, max]) {
        return this.#addBetween(left, [min, max], QueryGrammar.logicalOperator.or);
    }

    #addBetween(left, [min, max] = [], type) {
        const betw = new BetWeen(left, [min, max], type);
        this.#expressions.push(betw);
        return this;
    }

    //
    whereExists(query) {
        return this.#addExists(query, QueryGrammar.logicalOperator.and);
    }

    //
    orWhereExists(query) {
        return this.#addExists(query, QueryGrammar.logicalOperator.or);
    }

    #addExists(query, type) {
        const exis = new Exists(query, type);
        this.#expressions.push(exis);
        return this;
    }

    whereGroup(callBack) {
        return this.#addGroup(callBack, QueryGrammar.logicalOperator.and);
    }

    orWhereGroup(callBack) {
        return this.#addGroup(callBack, QueryGrammar.logicalOperator.or);
    }

    #addGroup(callBack, type) {
        if (!T.v.callable.func(callBack)) throw new TypeError('callBack ust be calleable.');
        const subWhereClause = new WhereClause(type);
        callBack(subWhereClause);
        this.#expressions.push(subWhereClause);
        return this;
    }

    toInstruction(hiddenType = false, countObj) {
        if (this.#expressions.length === 0) throw new QuerySyntaxError('conditions not initialized.');

        if (typeof hiddenType !== 'boolean') throw new TypeError('hiddenType must be a boolean.');
        const str = `${!hiddenType ? this.#type + ' ' : ''}(${this.#expressions.map((el, i) => {
            if (i === 0)
                return el.toInstruction(true, countObj);
            else return el.toInstruction(false, countObj);
        }).join(' ')})`;

        return str;
    }
}

module.exports = {WhereClause};