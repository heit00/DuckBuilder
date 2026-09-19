const { SchemaGrammar: Grammar } = require('../grammar/schemaGrammar');
const { ST, ELEMENT_VALUE_TYPE } = require('../symbol-lockup/symbols');

class Column {

  get[ELEMENT_VALUE_TYPE](){return ST.column}

  _name = '';
  _type = null;
  _primary = false;
  _autoIncrement = false;
  _unique = false;
  _nullable = false;
  _defaultValue = null;
  _references = null;
  _index = false;
  _length = null;
  _precision = null;
  _scale = null;

  constructor(name = '') {
    this._name = name;
  }

  static id(name = Grammar.defaultArgs.primaryKeyName) {
    const col = new Column();
    col.name(name);
    col.autoIncrement(true);
    col.primary(true);
    return col;
  }

  name(val) {
    if (val === undefined) return this._name;
    this._name = val;
    return this;
  }

  type(val) {
    if (val === undefined) return this._type;
    this._type = val;
    return this;
  }

  length(val) {
    if (val === undefined) return this._length;
    this._length = val;
    return this;
  }

  precision(val, scale = null) {
    if (val === undefined) return { precision: this._precision, scale: this._scale };
    this._precision = val;
    this._scale = scale;
    return this;
  }

  primary(val) {
    if (val === undefined) return this._primary;
    this._primary = val;
    return this;
  }

  autoIncrement(val) {
    if (val === undefined) return this._autoIncrement;
    this._autoIncrement = val;
    return this;
  }

  unique(val) {
    if (val === undefined) return this._unique;
    this._unique = val;
    return this;
  }

  nullable(val) {
    if (val === undefined) return this._nullable;
    this._nullable = val;
    return this;
  }

  default(val) {
    if (val === undefined) return this._defaultValue;
    this._defaultValue = val;
    return this;
  }

  references(table, columnName = Grammar.defaultArgs.primaryKeyName, options = {}) {
    if (table === undefined) return this._references;
    this._references = { table, columnName, ...options };
    return this;
  }

  index(val) {
    if (val === undefined) return this._index;
    this._index = val;
    return this;
  }
}

module.exports = { Column };