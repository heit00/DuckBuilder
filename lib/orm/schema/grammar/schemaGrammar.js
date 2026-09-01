class SchemaGrammar{
  static OnAction = {
    cascade: 'CASCADE',
    restrict: 'RESTRICT'
  }

  static RadicalTypes = {
    integer: 'INTEGER',
    varchar: 'VARCHAR',
    json: 'JSONB'
  }

  static defaultArgs = {
    publicSchema: 'public',
    primaryKeyName: 'id'
  }
}

module.exports = { SchemaGrammar };