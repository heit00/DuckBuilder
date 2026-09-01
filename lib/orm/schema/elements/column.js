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

  static id(name = Grammar.defaultArgs.primaryKeyName) {
    const col = new Column();
    col.name(name);
    col.autoIncrement(true);
    col.primary(true);
    return col;
  }

  name(val) {
    this.name = val;
    return this;
  }

  type(val) {
    this.type = val;
    return this;
  }

  length(val) {
    this.length = val;
    return this;
  }

  precision(val, scale = null) {
    this.precision = val;
    this.scale = scale;
    return this;
  }

  primary(val = true) {
    this.primary = val;
    return this;
  }

  autoIncrement(val = true) {
    this.autoIncrement = val;
    return this;
  }

  unique(val = true) {
    this.unique = val;
    return this;
  }

  nullable(val = true) {
    this.nullable = val;
    return this;
  }

  default(val) {
    this.defaultValue = val;
    return this;
  }

  references(table, field = 'id', options = {}) {
    this.references = { table, field, ...options };
    return this;
  }

  index(val = true) {
    this.index = val;
    return this;
  }
}

module.exports = { Column };