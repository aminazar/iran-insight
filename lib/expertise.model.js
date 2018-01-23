const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'expertise';
let idColumn = 'expertise_id';
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

  addExpertise(data) {
    if (data.length !== undefined && data.length !== null) {
      let promiseList = [];
      data.forEach(el => {
        promiseList.push(this.saveData(el));
      });
      return Promise.all(promiseList);
    }
    else
      return this.saveData(data);
  }

  getAll() {
    return this.sql.expertise.select();
  }

  get(expertise_id) {
    return this.sql[tableName].get({expertise_id: expertise_id});
  }

  deleteExpertise(pid ,expertise_id) {
    let curSql = Expertise.test ? sql.test : sql;
    return this.db.task(task => {
      return curSql.person.isAdmin({pid: pid}, task)
        .then(res => {
          if (res.length > 0)    //admin is going to delete a membership
            return curSql.expertise.delete(expertise_id, task)
          else
            return Promise.reject(Err.adminOnly);
        })
    })
  }
}

Expertise.test = false;
module.exports = Expertise;