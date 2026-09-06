class Reference{
    relationship = null;
    originTable = null;
    target = null;
    references = {}
    

    constructor(relationship, originTable, target, references) {
        if (!references || typeof references !== 'object') throw new Error('references must be a object.');
        if (Object.keys(references).length === 0) throw new RangeError('references must have at least one property.');
        this.relationship = relationship;
        this.originTable = originTable;
        this.target = target;
        this.references = references;
    }
}

class Relationship{
    type = Relationship.TYPES.oneToMany; 
    references = []
    name;

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

    createReference({originTable, target, references} = {}){
        const reference = new Reference(this, originTable, target, references);
        this.references.push(reference);
        return this;
    }
}

module.exports = { Relationship };