const SqlTable = require('./sqlTable.model');
let tableName = 'event';
let idColumn  = 'eid';
let columns = [

];

class Event extends SqlTable{
  constructor(test=Patient.test){
    super(tableName, idColumn, test, columns);
  }

  load(id) {
    return super.load({eid: id});
  }
}

Event.test = false;

module.exports=Event;