/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization_type';
let idColumn = 'org_type_id';

let cols = [
  'org_type_id',
  'name',
  'name_fa'
];

class OrganizationType extends SqlTable {
  constructor(test = OrganizationType.test) {
    super(tableName, idColumn, test, cols);
  }


  saveData(data, id) {
    if (!data.name || !data.name_fa)
      return Promise.reject(error.emptyOrgTypeName);

    return super.saveData(data, id);

  }

}

OrganizationType.test = false;
module.exports = OrganizationType;