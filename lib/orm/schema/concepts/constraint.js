const { SchemaGrammar } = require("../grammar/schemaGrammar");

class Constraint {
    
    _name = null;
    _type = null;
    _columns = [];
    _references = null;
    _onDelete = SchemaGrammar.OnAction.cascade;
    _onUpdate = SchemaGrammar.OnAction.restrict;
    _expression = null;
    _deferrable = false;
    _initiallyDeferrable = false;
    _enforced = true;

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
        if (val === undefined) return this._name;
        this._name = `${prefix ? prefix + '_' : ''}${val}`;
        return this;
    }

    type(val) {
        if (val === undefined) return this._type;
        this._type = val;
        return this;
    }

    columns(...cols) {
        if (cols.length === 0) return this._columns;
        this._columns = Array.isArray(cols[0]) && cols.length === 1 ? cols[0] : cols;
        return this;
    }

    references(table, columns = [SchemaGrammar.defaultArgs.primaryKeyName], options = {}) {
        if (table === undefined) return this._references;
        this._references = {
            table,
            columns: Array.isArray(columns) ? columns : [columns],
            ...options
        };
        return this;
    }

    onDelete(action) {
        if (action === undefined) return this._onDelete;
        this._onDelete = action;
        return this;
    }

    onUpdate(action) {
        if (action === undefined) return this._onUpdate;
        this._onUpdate = action;
        return this;
    }

    expression(raw) {
        if (raw === undefined) return this._expression;
        this._expression = raw;
        return this;
    }

    deferrable(val = true) {
        this._deferrable = val;
        return this;
    }

    initiallyDeferrable(val = true) {
        this._initiallyDeferrable = val;
        return this;
    }

    enforced(val = true) {
        this._enforced = val;
        return this;
    }

    primaryKey(...columns) {
        this._type = SchemaGrammar.constraints.types.primaryKey;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    unique(...columns) {
        this._type = SchemaGrammar.constraints.types.unique;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    foreignKey(...columns) {
        this._type = SchemaGrammar.constraints.types.foreignKey;
        if (columns.length > 0) this.columns(...columns);
        return this;
    }

    check(expression) {
        this._type = SchemaGrammar.constraints.types.check;
        if (expression !== undefined) this.expression(expression);
        return this;
    }
}

module.exports = { Constraint };