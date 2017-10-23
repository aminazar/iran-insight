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
  'previous_end_date',
  'current_start_date',
  'current_end_date',
  'description',
  'description_fa',
  'lce_type_id',
];

class OrganizationLCE extends SqlTable {
  constructor(test = OrganizationLCE.test) {
    super(tableName, idColumn, test, cols);
  }


  static temporalUpdate(data) {
    if (!data.oid1)
      return Promise.reject(error.emptyOId1InLCETable);
    if (!data.current_start_date)
      return Promise.reject(error.emptyStartDateInLCETable);

    let curSql = OrganizationLCE.test ? sql.test : sql;
    return curSql.organization_lce.temporalUpdate(data);

  }


  // static getById(oid) {
  //   let curSql = OrganizationLCE.test ? sql.test : sql;
  //   return curSql.organization.getById(id);
  // }

}

OrganizationLCE.test = false;
module.exports = OrganizationLCE;