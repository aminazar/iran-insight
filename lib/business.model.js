const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');
const randomString = require('randomstring');

let tableName = 'business';
let idColumn  = 'bid';
let businessColumns = ['bid', 'name', 'name_fa', 'ceo_pid', 'org_type_id', 'address', 'address_fa', 'tel', 'url', 'general_stats', 'financial_stats'];
class Business extends SqlTable{
  constructor(test = Business.test){
    Business.test = test;
    super(tableName, idColumn, test, businessColumns);
  }

  setProfile(data, username, user_id){
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.sql['membership'].isRepresentativeOrAdmin({username: username, pid: user_id})
        .then(res => {
          if(res.length === 0)
            return Promise.reject(error.notAllowed);
          else
            return this.saveData(data, data.bid);
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        })
    });
  }
}
Business.test = false;
module.exports = Business;