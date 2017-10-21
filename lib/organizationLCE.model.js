/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization_lce';
let idColumn = 'id';

let cols = [
  'id',
  'oid1',
  'oid2',
  'start_date',
  'start_date_fa',
  'end_date',
  'end_date_fa',
  'description',
  'description_fa',
  'lce_type_id',
];

class OrganizationLCE extends SqlTable {
  constructor(test = OrganizationLCE.test) {
    super(tableName, idColumn, test, cols);
  }


  saveData(data, id) {
    if (!data.oid1)
      return Promise.reject(error.emptyOId1InLCETable);
    if (!data.start_date || !data.start_date_fa)
      return Promise.reject(error.emptyStartDateInLCETable);

    return super.saveData(data, id);

  }

  // static getById(oid) {
  //   let curSql = OrganizationLCE.test ? sql.test : sql;
  //   return curSql.organization.getById(id);
  // }

}

OrganizationLCE.test = false;
module.exports = OrganizationLCE;