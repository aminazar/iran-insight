const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'expertise';
let idColumn  = 'expertise_id';
let expertiseColumns = [
  'expertise_id',
  'name_en',
  'name_fa',
  'is_education',
];

class Expertise extends SqlTable {
  constructor(test = Expertise.test) {
    Expertise.test = test;
    super(tableName, idColumn, test, expertiseColumns);
  }

  addExpertise(data){
    if(data.length !== undefined && data.length !== null){
      let promiseList = [];
      data.forEach(el => {
        promiseList.push(this.saveData(el));
      });
      return Promise.all(promiseList);
    }
    else
      return this.saveData(data);
  }
}

Expertise.test = false;
module.exports = Expertise;