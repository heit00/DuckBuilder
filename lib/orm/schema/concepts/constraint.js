const { SchemaGrammar } = require("../grammar/schemaGrammar");
const { ST, ELEMENT_VALUE_TYPE } = require('../../global-symbol-lockup/symbols');

class Constraint {
    get [ELEMENT_VALUE_TYPE]() { return ST.constraint; }
    
    #name = null;
    #type = null;
    #columns = [];
    #references = null;
    #onDelete = SchemaGrammar.OnAction.cascade;
    #onUpdate = SchemaGrammar.OnAction.restrict;
    #expression = null;
    #deferrable = false;
    #initiallyDeferrable = false;
    #enforced = true;

    static PREFIX = Object.freeze({
        unique: 'un',
        nullable: 'nu',
        check: 'ch',
        primary: 'pk'
    });

    static TYPES = SchemaGrammar.constraints.types;

    get name() { return this.#name; }
    set name(val) { this.#name = val; }
    setName(val, prefix) {
        this.#name = `${prefix ? prefix + '_' : ''}${val}`;
        return this;
    }

    get type() { return this.#type; }
    set type(val) { this.#type = val; }
    setType(val) {
        this.#type = val;
        return this;
    }

    get columns() { return this.#columns; }
    set columns(cols) {
        this.#columns = Array.isArray(cols) ? cols : [cols];
    }
    setColumns(...cols) {
        this.#columns = Array.isArray(cols[0]) && cols.length === 1 ? cols[0] : cols;
        return this;
    }

    get references() { return this.#references; }
    set references(ref) { this.#references = ref; }
    setReferences(table, columns = [SchemaGrammar.defaultArgs.primaryKeyName], options = {}) {
        if (options.onDelete) this.setOnDelete(options.onDelete);
        if (options.onUpdate) this.setOnUpdate(options.onUpdate);

        this.#references = {
            table,
            columns: Array.isArray(columns) ? columns : [columns],
        };
        return this;
    }

    get onDelete() { return this.#onDelete; }
    set onDelete(action) { this.#onDelete = action; }
    setOnDelete(action) {
        this.#onDelete = action;
        return this;
    }

    get onUpdate() { return this.#onUpdate; }
    set onUpdate(action) { this.#onUpdate = action; }
    setOnUpdate(action) {
        this.#onUpdate = action;
        return this;
    }

    get expression() { return this.#expression; }
    set expression(raw) { this.#expression = raw; }
    setExpression(raw) {
        this.#expression = raw;
        return this;
    }

    get deferrable() { return this.#deferrable; }
    set deferrable(val) { this.#deferrable = Boolean(val); }
    setDeferrable(val = true) {
        this.#deferrable = Boolean(val);
        return this;
    }

    get initiallyDeferrable() { return this.#initiallyDeferrable; }
    set initiallyDeferrable(val) { this.#initiallyDeferrable = Boolean(val); }
    setInitiallyDeferrable(val = true) {
        this.#initiallyDeferrable = Boolean(val);
        return this;
    }

    get enforced() { return this.#enforced; }
    set enforced(val) { this.#enforced = Boolean(val); }
    setEnforced(val = true) {
        this.#enforced = Boolean(val);
        return this;
    }

    primaryKey(...columns) {
        this.#type = SchemaGrammar.constraints.types.primaryKey;
        if (columns.length > 0) this.setColumns(...columns);
        return this;
    }

    unique(...columns) {
        this.#type = SchemaGrammar.constraints.types.unique;
        if (columns.length > 0) this.setColumns(...columns);
        return this;
    }

    foreignKey(...columns) {
        this.#type = SchemaGrammar.constraints.types.foreignKey;
        if (columns.length > 0) this.setColumns(...columns);
        return this;
    }

    check(expression) {
        this.#type = SchemaGrammar.constraints.types.check;
        if (expression !== undefined) this.setExpression(expression);
        return this;
    }
}

module.exports = { Constraint };