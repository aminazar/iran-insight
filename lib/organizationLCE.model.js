/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization_lce';
let idColumn = 'id';

let cols = [
  'id',
  'oid1',
  'oid2',
  'start_date',
  'end_date',
  'description',
  'description_fa',
  'lce_type_id',
];

class OrganizationLCE extends SqlTable {
  constructor(test = OrganizationLCE.test) {
    super(tableName, idColumn, test, cols);
  }

  getByOid(oid) {
    let curSql = OrganizationLCE.test ? sql.test : sql;

    return curSql.organization_lce.getByOId({oid});
  }


}

OrganizationLCE.test = false;
module.exports = OrganizationLCE;