const sql = require('../sql');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const moment = require('moment');
const spreadSheetHandler = require('./spreadsheet.handler');

const tableName = 'ex_data';
const idColumn = 'eid';
const exDataColumns = [
  'eid',
  'name',
  'market_share',
  'type',
  'category',
  'province',
];

class ExternalData extends SqlTable{
  constructor(test = false) {
    super(tableName, idColumn, test, exDataColumns);
  }

  readSpreadSheet(path) {
    let spsObj = new spreadSheetHandler();
    spsObj.readFile(path);

    let promiseList = [];

    this.db.task(t => {
      for(let counter = 0; counter < spsObj.getWorkSheetCount(); counter++) {
        spsObj.getWorksheet(counter);
        spsObj.parseWorksheet();

        spsObj.loadedValue.forEach(el => {
          promiseList.push(this.sql[tableName].add({
            name: el['نام سایت'] || el['نام سایت 2'] || el['نام سایت 3'],
            market_share: el['سهم سایت از کل ترافیک طبقه بندی'],
            type: el['بازار'],
            class: el['طبقه بندی'],
            category: spsObj.getWorksheetName(counter),
            province: el['استان'],
            hhi: el['شاخص هرفیندال هیرشمن (زمان حضور)'] ? el['شاخص هرفیندال هیرشمن (زمان حضور)'] : null,
          }, t));
        });
      }

      return Promise.all(promiseList)
        .then(res => {
          console.log('All data inserted into table');
        })
        .catch(err => {
          console.error('Cannot insert data into table. Error: ', err);
        });
    });
  }

  getCategories() {
    return this.sql[tableName].getCat();
  }

  get(phrase, offset, limit) {
    return this.sql[tableName].get({
      phrase: phrase ? phrase : null,
      offset: offset ? offset : 0,
      limit: limit ? limit : 10,
    });
  }
}

module.exports = ExternalData;