const { T } = require('../util/types');

const {
    IR,
    isQuery,
    isValue,
} = require('../symbol-lockup/symbols');

const{QueryGrammar} = require('../grammar/grammar');
const{Column} = require('./column');
const{QuerySyntaxError} = require('../util/error');
const{Bind} = require('./bind');

class InExpression {
    #left;
    #right;
    #type;
    #isNot;

    #normalize(val, side = 'left') {

        if (isValue(val)) {
            if (typeof val.hasAlias === 'function' && val.hasAlias()) throw new QuerySyntaxError('can not has alias in expressions.');

            return val;
        }

        if(T.v.filledString.func(val)) return side === 'left' ? new Column(val) : new Bind(val);

        else return new Bind(val)
    }

    constructor(left, right, type = QueryGrammar.logicalOperator.and, isNot = false) {
        if (typeof isNot !== 'boolean') throw new TypeError('isNot must be a boolean.');
        if (typeof type === 'string') type = type.toUpperCase();
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);

        if (Array.isArray(right)) {
            this.#right = right.map(el => {
                if(isQuery(el)) throw new QuerySyntaxError('subquery is not alowed in values array');
                return this.#normalize(el, 'right');
            });
        }
        else if (isQuery(right)) {
            this.#right = right;
        }
        else throw new TypeError('right must be an subquery or an array of values.');

        this.#type = type;
        this.#left = this.#normalize(left);
        this.#isNot = isNot;
    }

    toInstruction(hiddenType = false, count) {
        if (typeof hiddenType !== 'boolean') throw new TypeError('hiddenType must be a boolean.');

        const type = hiddenType ? '' : `${this.#type} `;
        const left = this.#left.toInstruction(count, IR.cte);

        const length = this.#right.length;
        const verb = this.#isNot ? QueryGrammar.extra.notIn : QueryGrammar.extra.in;

        if (Array.isArray(this.#right)) {
            const templateInExpression = this.#right.map(el => el.toInstruction(count)).join(', ');
            return `${type}${left} ${verb} (${templateInExpression})`;
        }
        else {
            const templateInExpression = this.#right.toInstruction(count, IR.cte);
            return `${type}${left} ${verb} ${templateInExpression}`;
        }
    }
}

class Expression {

    #type;
    #left;
    #operator;
    #right;

    #normalize(val, side = 'left') {

        if (isValue(val)) {
            if (typeof val.hasAlias === 'function' && val.hasAlias()) throw new QuerySyntaxError('can not has alias in expressions.');

            return val;
        }

        if (T.v.filledString.func(val)) {
            return side === 'left' ? new Column(val) : new Bind(val);
        }

        else return new Bind(val);
    }

    constructor(left, operator, right, type = 'AND') {
        if (typeof type === 'string') type = type.toUpperCase();

        if (!QueryGrammar.relationalOperators.has(operator)) throw new TypeError(`operator must be in: (${[...QueryGrammar.relationalOperators].join(', ')})`);

        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);

        this.#left = this.#normalize(left);
        this.#right = this.#normalize(right, 'right');

        this.#type = type;
        this.#operator = operator;

        //if(right === null && (operator !== 'IS' && operator !== 'IS NOT' || !(this.#left instanceof Column))) throw new QuerySyntaxError('conflict in null expression.');
    }

    toInstruction(hiddenType = false, count) {
        if (typeof hiddenType !== 'boolean') throw new TypeError('hiddenType must be a boolean.');
        let preString;
        const leftInst = this.#left.toInstruction(count, IR.subQuery);
        const rightInst = this.#right.toInstruction(count, IR.subQuery);
        if (!hiddenType) preString = [this.#type, leftInst, this.#operator, rightInst];
        else preString = [leftInst, this.#operator, rightInst];
        return preString.join(' ');
    }

}

module.exports = { Expression, InExpression };