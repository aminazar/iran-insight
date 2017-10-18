/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization';
let idColumn = 'oid';

class Organization extends SqlTable {
    constructor(test = Organization.test) {
        super(tableName, idColumn, test);
    }

    load(name) {
        return super.load({name: this.name});
    }

    importData(data) {
        this.name = data.name;
        this.oid = data.oid;
        this.ceo_pid = data.ceo_pid;
        this.org_type_id = data.org_type_id;
    }

    exportData() {
        return new Promise((resolve, reject) => {
          resolve({
              name: this.name,
              ceo_pid: this.ceo_pid,
              org_type_id: this.org_type_id

          });
        });
    }

    static select(){
        let curSql = Organization.test ? sql.test : sql;
        return curSql.organization.select();
    }



}

Organization.test = false;
module.exports = Organization;