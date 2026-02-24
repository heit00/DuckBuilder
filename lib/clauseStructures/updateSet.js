const { T } = require('../util/types');

const {
    isColumn,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {Column} = require('../lexicalStructures/column');

const {QuerySyntaxError} = require('../util/error');

const {Expression} = require('../lexicalStructures/expression');

class SetExpression{
    #expression;

    set(left, right){
        if(T.v.filledString.func(left)) left = new Column(left);
        else if(!(isColumn(left))) throw new TypeError('left must be a string or colunms instance.');

        const exp = new Expression(left, '=' , right);
        
        this.#expression = exp;

        return this;
    }

    toInstruction(count){
        const expString = this.#expression.toInstruction(true, count);

        return expString;
    }
}

class SetStructure{
    #sets = [];

    set(left, right){
        const set = new SetExpression().set(left, right);
        this.#sets.push(set);

        return this;
    }

    toInstruction(count){
        if(this.#sets.length === 0) throw new QuerySyntaxError('sets not initiliazed.');

        const verb = QueryGrammar.clauses.set;
        const setString = this.#sets.map(el => el.toInstruction(count)).join(', ');

        return `${verb} ${setString}`;
    }
}

module.exports = { SetExpression, SetStructure};
