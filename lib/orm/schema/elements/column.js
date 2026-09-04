const { SchemaGrammar: Grammar } = require('../grammar/schemaGrammar');

class Column {
  name = '';
  type = null;
  primary = false;
  autoIncrement = false;
  unique = false;
  nullable = false;
  defaultValue = null;
  references = null;
  index = false;
  length = null;
  precision = null;
  scale = null;

  static id(name = Grammar.defaultArgs.primaryKeyName) {
    const col = new Column();
    col.name(name);
    col.autoIncrement(true);
    col.primary(true);
    return col;
  }

  name(val) {
    if (val === undefined) return this.name;
    this.name = val;
    return this;
  }

  type(val) {
    if (val === undefined) return this.type;
    this.type = val;
    return this;
  }

  length(val) {
    if (val === undefined) return this.length;
    this.length = val;
    return this;
  }

  precision(val, scale = null) {
    if (val === undefined) return { precision: this.precision, scale: this.scale };
    this.precision = val;
    this.scale = scale;
    return this;
  }

  primary(val) {
    if (val === undefined) return this.primary;
    this.primary = val;
    return this;
  }

  autoIncrement(val) {
    if (val === undefined) return this.autoIncrement;
    this.autoIncrement = val;
    return this;
  }

  unique(val) {
    if (val === undefined) return this.unique;
    this.unique = val;
    return this;
  }

  nullable(val) {
    if (val === undefined) return this.nullable;
    this.nullable = val;
    return this;
  }

  default(val) {
    if (val === undefined) return this.defaultValue;
    this.defaultValue = val;
    return this;
  }

  references(table, field = Grammar.defaultArgs.primaryKeyName, options = {}) {
    if (table === undefined) return this.references;
    this.references = { table, field, ...options };
    return this;
  }

  index(val) {
    if (val === undefined) return this.index;
    this.index = val;
    return this;
  }
}

module.exports = { Column };