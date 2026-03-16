const { T } = require('../util/types');
const { isBind, isTemplateCount, QUERY_GENERIC_TYPE, QT, isStructure } = require('../symbol-lockup/symbols');
const { Bind } = require('./bind');
const { QuerySyntaxError } = require('../util/error');
const { QueryGrammar } = require('../grammar/grammar');

const placeholder = '?'; //a regex would work too

class Raw {

    get[QUERY_GENERIC_TYPE]() { return QT.raw };

    #values = [];
    #raw;
    //add type

    hasValues(){
        return this.#values.length > 0;
    }

    constructor(raw, ...values) {
        if (!T.v.filledString.func(raw)) throw new TypeError('raw must be a string.');
        if(values.length === 1 && Array.isArray(values[0])) values = values[0];

        if(values !== undefined)
        this.#values = values.map(el => {
            if (isBind(el)) return el;
            else return new Bind(el);
        });

        this.#raw = raw;
    }

    get values() {
        return [...this.#values];
    }

    get raw() {
        return this.#raw;
    }

    /**
     * @param {import('../util/template').TemplateCount} count 
     */
    toInstruction(count) {
        const raw = this.#raw;
        const values = this.#values;

        const parts = raw.split(placeholder);

        if (parts.length !== values.length + 1) {
            throw new QuerySyntaxError(`Raw SQL expected ${parts.length - 1} placeholders, but got ${values.length} values.`);
        }

        for (let i = 0; i < values.length; i++) {
            parts[i] += values[i].toInstruction(count);
        }

        return parts.join('');
    }
}

class WhereRaw extends Raw{
    #type;

    constructor(type, raw, values){
        super(raw, values);
        if(typeof type === 'string') type = type.toUpperCase();
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);

        this.#type = type;
    }

    toInstruction(hiddenType = false, count){
        if(typeof hiddenType !== 'boolean') throw new TypeError('hiddenType must be a boolean.');
        const type = !hiddenType ? `${this.#type} ` : '';
        const raw = super.toInstruction(count);
        return `${type}${raw}`;
    }
}

//JOIN RAW... MAYBE

module.exports = { Raw, WhereRaw };

