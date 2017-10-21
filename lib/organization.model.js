/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization';
let idMember = 'oid';


let cols = [
  'oid',
  'name',
  'name_fa',
  'ceo_pid',
  'org_type_id',
];

class Organization extends SqlTable {
  constructor(test = Organization.test) {
    super(tableName, idMember, test, cols);
  }

  saveData(data, id) {
    if (!data.name || !data.name_fa)
      return Promise.reject(error.emptyOrgName);

    return super.saveData(data, id);

  }

  static getById(oid) {
    let curSql = Organization.test ? sql.test : sql;
    return curSql.organization.getById({oid});
  }

  static getAll() {
    let curSql = Organization.test ? sql.test : sql;
    return curSql.organization.getAll();
  }
}

Organization.test = false;
module.exports = Organization;