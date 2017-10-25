/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'business_lce';
let idColumn = 'id';

let cols = [
  'id',
  'bid1',
  'bid2',
  'start_date',
  'end_date',
  'description',
  'description_fa',
  'aid',
  'lce_type_id',
];

class BusinessLCE extends SqlTable {
  constructor(test = BusinessLCE.test) {
    super(tableName, idColumn, test, cols);
  }

  getByBid(bid) {
    let curSql = BusinessLCE.test ? sql.test : sql;

    return curSql.business_lce.getByBId({bid});
  }


}

BusinessLCE.test = false;
module.exports = BusinessLCE;