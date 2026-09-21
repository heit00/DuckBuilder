const { VisitorPostgresSQL } = require("..");
const { CompilerGrammar:CG } = require("../grammar/compileGrammar");

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL{
  #tables = [];
  #foreingKeys = [];
  #indexes = [];
  
  [ST.column]() {  }
  [ST.constraint]() {  }

  /**
   * 
   * @param {import('../../../schema/elements/table').TableSchema} table 
   */
  [ST.table](table) { 
    
  }
  [ST.relationship]() {  }
  [ST.type]() { }
}

class TableVisitorNode{
  /**
   * @param {import('../../../schema/elements/table').TableSchema} table 
   */
  getHeader(table){
    const header = `${CG.statements.create} ${table.name} ${CG.conditionals.ifNotExists}`;
  }

  
}



