const { VisitorPostgresSQL } = require("..");

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL{
  #tables = [];
  #foreingKeys = [];
  #indexes = [];
  
  [ST.column]() {  }
  [ST.constraint]() {  }
  [ST.table](table) { 
    
   }
  [ST.relationship]() {  }
  [ST.type]() { }
}

/**
 * My life was a error, i wanna die, NO solution.
 */