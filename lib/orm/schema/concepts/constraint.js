const { SchemaGrammar } = require("../grammar/schemaGrammar");

class Constraint {
    
    name = null;
    type = null;
    columns = [];
    references = null;
    onDelete = SchemaGrammar.OnAction.cascade;
    onUpdate = SchemaGrammar.OnAction.restrict;
    expression = null;
    deferrable = false;
    initiallyDeferrable = false;
    enforced = true;

    static PREFIX = Object.freeze({
        unique: 'un',
        nullable: 'nu',
        check: 'ch',
        primary: 'pk'
        //...
    });

    static TYPES = Object.freeze({
        unique: 'UNIQUE',
        notNull: 'NOT NULL',
        check: 'CHECK',
        foreignKey: 'FOREIGN KEY',
        primaryKey: 'PRIMARY KEY'
    })

    name(val, prefix) {
        if (val === undefined) return this.name;
        this.name = `${prefix ? prefix + '_' : ''}${val}`;
        return this;
    }

    type(val) {
        if (val === undefined) return this.type;
        this.type = val;
        return this;
    }

    columns(...cols) {
        if (cols.length === 0) return this.columns;
        this.columns = Array.isArray(cols[0]) && this.columns.length === 1 ? cols[0] : cols;
        return this;
    }

    references(table, columns = [SchemaGrammar.defaultArgs.primaryKeyName], options = {}) {
        if (table === undefined) return this.references;
        this.references = {
            table,
            columns: Array.isArray(columns) ? columns : [columns],
            ...options
        };
        return this;
    }

    onDelete(action) {
        if (action === undefined) return this.onDelete;
        this.onDelete = action;
        return this;
    }

    onUpdate(action) {
        if (action === undefined) return this.onUpdate;
        this.onUpdate = action;
        return this;
    }

    expression(raw) {
        if (raw === undefined) return this.expression;
        this.expression = raw;
        return this;
    }

    deferrable(val = true) {
        this.deferrable = val;
        return this;
    }

    initiallyDeferrable(val = true) {
        this.initiallyDeferrable = val;
        return this;
    }

    enforced(val = true) {
        this.enforced = val;
        return this;
    }

    primaryKey(...columns) {
        this.type = SchemaGrammar.constraints.types.primaryKey;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    unique(...columns) {
        this.type = SchemaGrammar.constraints.types.unique;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    foreignKey(...columns) {
        this.type = SchemaGrammar.constraints.types.foreignKey;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    check(expression) {
        this.type = SchemaGrammar.constraints.types.check;
        if (expression !== undefined) this.expression(expression);
        return this;
    }
}

module.exports = { Constraint };