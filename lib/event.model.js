const SqlTable = require('./sqlTable.model');
const moment = require('moment');

let tableName = 'event';
let idColumn  = 'eid';
let columns = [
  "organizer_pid",
  "organizer_oid",
  "organizer_bid",
  "title",
  "title_fa",
  "address",
  "address_fa",
  "geo_location",
  "start_date",
  "end_date",
  "description",
  "description_fa",
];

class Event extends SqlTable{
  constructor(test = Event.test){
    Event.test = test;
    super(tableName, idColumn, test, columns);
  }

  load(id) {
    return super.load({eid: id});
  }

  importData(data) {
    this.columns.concat(this.idMember).forEach( c => {
      if(data[c]) {
        if (data[c].constructor.name === 'Date') {
          this[c] = moment(data[c]).format('YYYYMMDD');
        } else {
          this[c] = data[c];
        }
      }
    })
  }
}

Event.test = false;

module.exports=Event;