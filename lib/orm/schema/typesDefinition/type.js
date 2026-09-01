const TYPES = new Map([]);

class Type{
  name;
  radical;
  from() { return 'not implemented' }
  to() { return 'not implemented' }
  
  constructor(name, radical) {
    this.name = name;
    this.radical = radical;
  }
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



