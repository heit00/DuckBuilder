const { isValue, isColumn, isQuery, isRaw, IT, IR } = require('../symbol-lockup/symbols');
const { T } = require('../util/types');
const { QuerySyntaxError } = require('../util/error');
const { Bind } = require('../lexicalStructures/bind');
const { QueryGrammar } = require('../grammar/grammar');
const { Column } = require('../lexicalStructures/column');
const { SetStructure } = require('./updateSet');

class OnConflict {
    #conflict_target = undefined; //DEFAULT = DO NOTHING;
    #setStructure = new SetStructure();
    #doNothing = true;

    conflict(conflict_target){
        if (T.v.filledString.func(conflict_target)) conflict_target = new Column(conflict_target);
        else if (!(isColumn(conflict_target)) && !isRaw(conflict_target)) throw new TypeError('conflict_target must be a string or colunms instance.');
        if (isColumn(conflict_target) && (conflict_target.hasTable() || conflict_target.hasAlias())) throw new QuerySyntaxError('can not has table reference sintax in OnConflict expression.');

        this.#conflict_target = conflict_target;

        return this;
    }

    set(left, right){
        this.#setStructure.set(left, right);
        this.#doNothing = false;
        return this;
    }

    toInstruction(count){
        const verb = QueryGrammar.clauses.onConflict;
        const doVerb = QueryGrammar.clauses.do;
        const nothing = QueryGrammar.clauses.nothing;
        const doNothing = this.#doNothing;

        if(doNothing){
            const conflict_target = this.#conflict_target !== undefined ? ` (${this.#conflict_target.toInstruction(count)})` : '';
            return `${verb}${conflict_target} ${doVerb} ${nothing}`;
        }
        else{
            if(this.#conflict_target === undefined) throw new QuerySyntaxError('conflict_target is mandatory on UPDATE ON clause.');
            const conflict_target = `(${this.#conflict_target.toInstruction(count)})`;
            const setStructure = this.#setStructure;
            const verbUpdate = QueryGrammar.actions.update;
            return `${verb} ${conflict_target} ${doVerb} ${verbUpdate} ${setStructure.toInstruction(count)}`;
        }
    }
}

module.exports = { OnConflict };