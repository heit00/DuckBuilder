const { QueryGrammar } = require('../grammar/grammar');
const { QUERY_VALUE_TYPE, QT, isValue, isTable,isRaw, isQuery, IR, SQL_FUNCTIONS } = require('../symbol-lockup/symbols');
const { T } = require('../util/types');
const { QuerySyntaxError } = require('../util/error');
const { Column } = require('./column');
const { Bind } = require('./bind');

class NASQLFunction {
    get [QUERY_VALUE_TYPE]() { return QT.function };

    #radical;
    #args = [];
    #alias = undefined;

    #normalize(val) {

        //value already validate functions
        if (isValue(val) || isTable(val) || isRaw(val) || isQuery(val)) {
            if (typeof val.hasAlias === 'function' && val.hasAlias()) throw new QuerySyntaxError('can not has alias in functions');

            return val;
        }

        if (T.v.filledString.func(val)) {
            return new Column(val) //default
        }

        else return new Bind(val);
    }

    constructor(radical, ...args) {
        if (!T.v.filledString.func(radical)) throw new TypeError('radical must be a string.');
        if (args.length === 1 && Array.isArray(args[0])) args = args[0];

        args = args.map(el => this.#normalize(el));

        this.#args = args;
        this.#radical = radical;
    }

    //Can not has alias in expressions
    hasAlias(){
        return this.#alias !== undefined
    }

    as(alias = undefined) {
        if (alias !== undefined && !T.v.filledString.func(alias)) throw new TypeError('alias must be a string.');
        this.#alias = alias;

        return this;
    }

    toInstruction(count) {
        const str1 = this.#radical;
        const str2 = this.#args.length === 0 ? '' : this.#args.map(el => el.toInstruction(count, IR.cte)).join(', ');
        const alias = this.#alias !== undefined ? ` ${QueryGrammar.extra.as} "${this.#alias}"` : '';
        return `${str1}(${str2})${alias}`;
    }
}

class Count extends NASQLFunction {

    constructor(arg) {
        //if undefined, new bind() will explode
        //functions are already incorporated in isValue
        if (isTable(arg)) throw new QuerySyntaxError('can not has tabel in count function.');
        super(SQL_FUNCTIONS.count, arg);
    }

}

class Coalesce extends NASQLFunction {
    constructor(...args) {
        if (args.length === 1 && Array.isArray(args[0])) args = args[0]; 
        if (args.length < 2) throw new QuerySyntaxError('coalesce requires at least 2 arguments.');
        if (args.some(el => isTable(el))) throw new QuerySyntaxError('can not has table in coalescence.');
        super(SQL_FUNCTIONS.coalesce, ...args);
    }
}

class Max extends NASQLFunction {
    constructor(arg) {
        if (isTable(arg)) throw new QuerySyntaxError('can not has tabel in max function.');
        super(SQL_FUNCTIONS.max, arg);
    }
}

class Min extends NASQLFunction {
    constructor(arg) {
        if (isTable(arg)) throw new QuerySyntaxError('can not has tabel in min function.');
        super(SQL_FUNCTIONS.min, arg);
    }
}

class Sum extends NASQLFunction {
    constructor(arg){
        if (isTable(arg)) throw new QuerySyntaxError('can not has tabel in sum function.');
        super(SQL_FUNCTIONS.sum, arg);
    }
}

class Avg extends NASQLFunction{
    constructor(arg){
        if (isTable(arg)) throw new QuerySyntaxError('can not has tabel in avg function.');
        super(SQL_FUNCTIONS.avg, arg);
    }
}

module.exports = { Coalesce, Count, Max, Min, Sum, Avg };

//YOU CAN PROVIDE MORE FUNCTIONS IN THIS STYLE <=> CLASS<FUNC NAME> EXTENDS NASQLFunction AND PROVIDES RADICAL AND ARGS