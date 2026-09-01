const { Type, defineType } = require('./type');

class Integer extends Type{
  constructor() { super('int', 'INTEGER'); }

  to(value) {
    if(value === undefined || value === null) return null;
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || Number.isNaN(parsed)) throw new TypeError('Expected integer received: ' + value);
    return parsed;
  }

  from(value) {
    if(value === undefined || value === null) return null;
    const parsed = Number.parseInt(value)
    if (Number.isNaN(parsed)) throw new TypeError('Expected integer received: ' + value);
    return parsed;
  }
}

class JsonType extends Type{
  constructor() { super('json', 'JSONB') }
  
  to(value) { 
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }
  
  from(value) {
    if ( value === undefined ||  value === null) return null;
    if (typeof value === 'object') return value;
    return JSON.parse(value);
   }
}

class VarChar extends Type{
  length;
  constructor(length) {
    super('varchar', 'VARCHAR');
    this.length = length;
  }

  to(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    return String(value).toString();
  }

  from(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    return String(value).toString();
  }
}

// other classes will be here
// ...

defineType(Integer);
defineType(VarChar);
defineType(JsonType);