class Reference{
    relationship = null;
    originTable = null;
    originTableColumnName = null;
    target = null;
    targetColumnName = null;

    constructor(relationship, originTable, originTableColumnName, target, targetColumnName){
        this.relationship = relationship;
        this.originTable = originTable;
        this.originTableColumnName = originTableColumnName;
        this.target = target;
        this.targetColumnName = targetColumnName;
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

    constructor(name, type){
        this.name = name;
        this.type = type;
    }

    createReference({originTable, originTableColumnName, target, targetColumnName} = {}){
        const reference = new Reference(this, originTable, originTableColumnName, target, targetColumnName);
        this.references.push(reference);
        return this;
    }
}

module.exports = { Relationship };