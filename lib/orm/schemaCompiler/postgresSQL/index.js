const { ST } = require('../../global-symbol-lockup/symbols');

class VisitorPostgresSQL{
  [ST.column]() { throw new Error(`method ${ST.column}() not implemented.`); }
  [ST.constraint]() { throw new Error(`method ${ST.constraint}() not implemented.`); }
  [ST.table]() { throw new Error(`method ${ST.table}() not implemented.`); }
  [ST.relationship]() { throw new Error(`method ${ST.relationship}() not implemented.`); }
  [ST.type]() { throw new Error(`method ${ST.type}() not implemented.`); }
}

module.exports = {VisitorPostgresSQL}