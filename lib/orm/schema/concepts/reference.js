const { registerTable } = require('../internal/tablesRegister');
const { ST, ELEMENT_VALUE_TYPE, isConstraint } = require('../../global-symbol-lockup/symbols');

class Reference{
    relationship = null;
    originTable = null;
    target = null;
    references = {};
    constraint = null;
    

    constructor(relationship, originTable, target, references, constraint) {
        if(constraint && !isConstraint(constraint)) throw new TypeError('constraint must be a Constraint class.');
        if (!references || typeof references !== 'object') throw new Error('references must be a object.');
        if (Object.keys(references).length === 0) throw new RangeError('references must have at least one property.');
        this.relationship = relationship;
        this.originTable = originTable;
        this.target = target;
        this.references = references;
        this.constraint = constraint;
    }
}

class Relationship{
    get [ELEMENT_VALUE_TYPE]() { return ST.relationship; }

    type = Relationship.TYPES.oneToMany; 
    references = []
    name;
    pivot = null;

    static TYPES = Object.freeze({
        oneToOne: '1-1',
        oneToMany: '1-N', 
        manyToOne: 'N-1',
        manyToMany: 'N-N' 
    });

    static PREFIX = Object.freeze({
        foreign: 'fk'
    })

    constructor(name, type){
        this.name = name;
        this.type = type;
    }

    createReference({originTable, target, references, constraint} = {}){
        const reference = new Reference(this, originTable, target, references, constraint);
        this.references.push(reference);
        return this;
    }

    setPivot(pivot){
        this.pivot = pivot;
    }
}

module.exports = { Relationship };