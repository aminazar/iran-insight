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

class OrganizationLCE extends SqlTable {
  constructor(test = OrganizationLCE.test) {
    super(tableName, idColumn, test);
  }

  load(name) {
    return super.load({name: this.name});
  }

  importData(data) {
    this.oid1 = data.oid1;
    this.oid2 = data.oid1;
    this.start_date = data.oid1;
    this.start_date_fa = data.oid1;
    this.end_date = data.oid1;
    this.end_date_fa = data.oid1;
    this.description = data.oid1;
    this.description_fa = data.oid1;
    this.lce_type_id = data.lce_type_id;

  }

  exportData() {
    return new Promise((resolve, reject) => {
      resolve({
        oid1: this.oid1,
        oid2: this.oid2,
        start_date: this.start_date,
        start_date_fa: this.start_date_fa,
        end_date: this.end_date,
        end_date_fa: this.end_date_fa,
        description: this.description,
        description_fa: this.description_fa,
        lce_type_id: this.lce_type_id,

      });
    });
  }

  static getById(oid) {
    let curSql = OrganizationLCE.test ? sql.test : sql;
    return curSql.organization_lce.getById({oid});
  }

}

OrganizationLCE.test = false;
module.exports = OrganizationLCE;