const { ELEMENT_VALUE_TYPE, ST } = require('../../global-symbol-lockup/symbols');

const TYPES = new Map();

class Type{
  get [ELEMENT_VALUE_TYPE]() { return ST.type; }

  name;
  baseType;
  args = [];

  from() { return 'not implemented' }
  to() { return 'not implemented' }
  
  constructor(name, baseType, args = []) {
    this.name = name;
    this.baseType = baseType;
    this.args = Array.isArray(args) ? args : (args !== undefined && args !== null ? [args] : []);
  }

  get radical() { return this.baseType; }
  set radical(val) { this.baseType = val; }
}

function defineType(type) {
  if (typeof type !== 'function' || !((type.prototype) instanceof Type)) throw new Error('a extended-Type class must be send.');
  if (TYPES.has(type.name)) throw new Error('type already registered.');
  TYPES.set(type.name, type);
}

function getType(name) {
      const type = TYPES.get(name);
      if (!type) throw new ReferenceError(`Type "${name}" not found.`);
      return type;
}

module.exports = { Type, defineType, getType };



