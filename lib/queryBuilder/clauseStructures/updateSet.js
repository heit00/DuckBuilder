const { T } = require('../util/types');

const {
    isColumn,
    isRaw
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {Column} = require('../lexicalStructures/column');

const {QuerySyntaxError} = require('../util/error');

const {Expression} = require('../lexicalStructures/booleanable');

class SetExpression{
    #expression;

    set(left, right){
        if(T.v.filledString.func(left)) left = new Column(left);
        else if(!(isColumn(left)) && !isRaw(left)) throw new TypeError('left must be a string or colunms instance.');
        if(isColumn(left) && left.hasTable()) throw new QuerySyntaxError('can not has table reference sintax in set expression.'); 

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

    set(left, right) {
        if (left && !Array.isArray(left) && typeof left === 'object' && right === undefined) {
            for (const [key, value] of Object.entries(left)) {
                this.#sets.push(new SetExpression().set(key, value));
            }
        }
        else {
            const set = new SetExpression().set(left, right);
            this.#sets.push(set);
        }
        
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
