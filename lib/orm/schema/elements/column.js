const { SchemaGrammar: Grammar } = require('../grammar/schemaGrammar');
const { ST, ELEMENT_VALUE_TYPE, isType } = require('../../global-symbol-lockup/symbols');
const { getType } = require('../typesDefinition/type')

class Column {
  get [ELEMENT_VALUE_TYPE]() { return ST.column; }

  #name = '';
  #type = null;
  #primary = false;
  #autoIncrement = false;
  #unique = false;
  #nullable = false;
  #defaultValue = null;
  #references = null;
  #index = false;
  #length = null;
  #precision = null;
  #scale = null;

  constructor(name = '') {
    this.#name = name;
  }

  static id(name = Grammar.defaultArgs.primaryKeyName) {
    return new Column(name)
      .setAutoIncrement(true)
      .setPrimary(true);
  }

  get name() { return this.#name; }
  set name(val) { this.#name = val; }
  setName(val) {
    this.#name = val;
    return this;
  }

  get type() { return this.#type; }
  set type(val) { this.setType(val); }
  setType(val, ...args) {
    if (typeof val === 'string') {
      const TypeClass = getType(val);
      if (!TypeClass) throw new TypeError(`type ${val} doesn't exist.`);
      this.#type = new TypeClass(...args);
      return this;
    }
    if (!isType(val)) throw new TypeError('val must be a Type instance.');
    this.#type = val;
    return this;
  }

  get length() { return this.#length; }
  set length(val) { this.#length = val; }
  setLength(val) {
    this.#length = val;
    return this;
  }

  get precision() { return { precision: this.#precision, scale: this.#scale }; }
  set precision(val) {
    if (val && typeof val === 'object') {
      this.#precision = val.precision ?? null;
      this.#scale = val.scale ?? null;
    } else {
      this.#precision = val;
    }
  }
  setPrecision(val, scale = null) {
    this.#precision = val;
    this.#scale = scale;
    return this;
  }

  get primary() { return this.#primary; }
  set primary(val) { this.#primary = Boolean(val); }
  setPrimary(val = true) {
    this.#primary = Boolean(val);
    return this;
  }

  get autoIncrement() { return this.#autoIncrement; }
  set autoIncrement(val) { this.#autoIncrement = Boolean(val); }
  setAutoIncrement(val = true) {
    this.#autoIncrement = Boolean(val);
    return this;
  }

  get unique() { return this.#unique; }
  set unique(val) { this.#unique = Boolean(val); }
  setUnique(val = true) {
    this.#unique = Boolean(val);
    return this;
  }

  get nullable() { return this.#nullable; }
  set nullable(val) { this.#nullable = Boolean(val); }
  setNullable(val = true) {
    this.#nullable = Boolean(val);
    return this;
  }

  get default() { return this.#defaultValue; }
  set default(val) { this.#defaultValue = val; }
  setDefault(val) {
    this.#defaultValue = val;
    return this;
  }

  get references() { return this.#references; }
  set references(val) { this.#references = val; }
  setReferences(table, columnName = Grammar.defaultArgs.primaryKeyName, options = {}) {
    this.#references = { table, columnName, ...options };
    return this;
  }

  get index() { return this.#index; }
  set index(val) { this.#index = Boolean(val); }
  setIndex(val = true) {
    this.#index = Boolean(val);
    return this;
  }
}

module.exports = { Column };