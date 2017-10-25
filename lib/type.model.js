/**
 * Created by Amin on 01/02/2017.
 */
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let idColumn = 'id';

let cols = [
  'name',
  'name_fa',
  'suggested_by',
  'active',
];

class Type extends SqlTable {
  constructor(tableName, test) {
    super(tableName, idColumn, test, cols);
  }


  saveData(data, id) {
    if (!data.name || !data.name_fa)
      return Promise.reject(error.emptyOrgTypeName);

    return super.saveData(data, id);

  }

}

module.exports = Type;