const { T } = require('../util/types');

const {
    QUERY_VALUE_TYPE,
    QT,
    IR,
    isValue,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {QuerySyntaxError} = require('../util/error');

const {Bind} = require('../lexicalStructures/bind');

const {TemplateCount} = require('../util/template');

const {WhereClause} =  require('./where');

class When {
    #where = new WhereClause();
    #value = undefined;

    when(left, operator, right) {


        // WHY only WHEN method has this? RESP: because this is not an WhereGroup, is acess to other complex structures, so when can do that while orWhen just do simple group with OR logical
        // you cand use when withiout callback so the default is simple AND expression...

        if (T.v.callable.func(left)) {
            left(this.#where);
            return this;
        }

        this.#where.where(left, operator, right);
        return this;
    }

    //orWhen would be useless

    then(value) {
        if (this.#value !== undefined) throw new QuerySyntaxError('then clause already defined.');

        //USE DUCKING TYPE
        if (!isValue(value)) value = new Bind(value);
        if (typeof value.hasAlias === 'function') if (value.hasAlias()) throw new QuerySyntaxError('can not has alias in "THEN" expression.');
        this.#value = value;

        return this;
    }

    /**
     * @param {TemplateCount} count 
     */
    toInstruction(count) {
        if (this.#value === undefined) throw new QuerySyntaxError('then clause not defined.');

        const whereString = this.#where.toInstruction(true, count);
        const when = QueryGrammar.clauses.when;
        const then = QueryGrammar.clauses.then;
        const value = this.#value.toInstruction(count, IR.cte);

        return `${when} ${whereString} ${then} ${value}`;
    }
}


class CaseClause {

    get [QUERY_VALUE_TYPE]() { return QT.case; }

    #when = [];
    #alias = undefined;
    #else = undefined;
    #initial = undefined;

    constructor(alias = undefined, initial = undefined) {
        if (initial !== undefined && !isValue(initial)) initial = new Bind(initial);
        const operators = Object.values(QueryGrammar.logicalOperator)
        if (!T.v.filledString.func(alias) && alias !== undefined) throw new TypeError('alias must be a string.');
        this.#alias = alias;
        this.#initial = initial;
    }

    as(alias) {
        if (this.#alias !== undefined) throw new QuerySyntaxError('alias already defined.');
        if (!T.v.filledString.func(alias)) throw new TypeError('alias must be a string.');
        this.#alias = alias;
    }

    hasAlias() {
        return this.#alias !== undefined;
    }

    when(left, operator, right, result) {
        if(result === undefined){
            result = right;
            right = operator;
            operator = '=';
        }

        if (T.v.callable.func(left)) {
            result = operator;
            const whenObj = new When();
            whenObj.when(left);
            whenObj.then(result);
            this.#when.push(whenObj);
            return this;
        }
        else {
            const whenObj = new When();
            whenObj.when(left, operator, right);
            whenObj.then(result);
            this.#when.push(whenObj);
            return this;
        }
    }

    else(value) {
        if (this.#else !== undefined) throw new QuerySyntaxError('else clause already defined.');

        if (!isValue(value)) value = new Bind(value);
        this.#else = value;

        return this;
    }

    toInstruction(count) {
        if(this.#when.length === 0) throw new QuerySyntaxError('when not initialized.');

        const initial = this.#initial !== undefined ? ` ${this.#initial.toInstruction(count, IR.cte)}` : '';
        const caseVerb = QueryGrammar.clauses.case;
        const templateString = this.#when.map(el => el.toInstruction(count)).join(' ');
        const endVerb = QueryGrammar.clauses.end;
        const alias = this.#alias !== undefined ? ` ${QueryGrammar.extra.as} ${this.#alias}` : '';
        const elseVerb = QueryGrammar.clauses.else;
        const elseValue = this.#else !== undefined ? this.#else.toInstruction(count, IR.cte) : undefined;
        const elseStatement = this.#else !== undefined ? ` ${elseVerb} ${elseValue}` : '';

        return `(${caseVerb}${initial} ${templateString}${elseStatement} ${endVerb})${alias}`;
    }
}

module.exports = { CaseClause };