const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');
const randomString = require('randomstring');

let tableName = 'business';
let membershipTable = 'membership';
let productTable = 'product';
let personTable = 'person';
let businessProductTable = 'business_product';
let idColumn = 'bid';
let businessColumns = [
  'bid',
  'name',
  'name_fa',
  'ceo_pid',
  'org_type_id',
  'address',
  'address_fa',
  'tel',
  'url',
  'general_stats',
  'financial_stats'
];

class Business extends SqlTable {
  constructor(test = Business.test) {
    Business.test = test;
    super(tableName, idColumn, test, businessColumns);
  }

  setProfile(data, user_id) {
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.sql[membershipTable].isRepresentativeOrAdmin({
        pid: user_id,
        bid: data.bid ? data.bid : null,
        oid: data.oid ? data.oid : null
      })
        .then(res => {
          if (res.length === 0)
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

  addProduct(data) {
    if (data.length) {
      let promiseList = [];
      data.forEach(el => {
        promiseList.push(this.sql[productTable].add(el));
      });
      return Promise.all(promiseList);
    }
    else
      return this.sql[productTable].add(data);
  }

  getAllProducts() {
    return this.sql[productTable].select();
  }

  getProduct(product_id) {
    return this.sql[productTable].get({product_id: product_id});
  }

  addBusinessProduct(data, person_id) {
    return new Promise((resolve, reject) => {
      (!data.bid) ?
        Promise.reject(error.noBusinessIdDeclare)
        :
        this.sql[personTable].bizRep({bid: data.bid, pid: person_id})
          .then(res => {
            if (res.length < 1)
              return Promise.reject(error.notBizRep);

            if (data.product_id)
              return Promise.resolve({product_id: data.product_id});
            else if (!data.product)
              return Promise.reject(error.noProductDeclare);
            else
              return this.addProduct(data.product);
          })
          .then(res => {
            if (data.bpid)
              return this.sql[businessProductTable].update({
                market_share: (data.market_share) ? data.market_share : null,
              }, data.bpid);
            else
              return this.sql[businessProductTable].add({
                bid: data.bid,
                product_id: res.product_id,
                market_share: (data.market_share) ? data.market_share : null
              });
          })
          .then(resolve)
          .catch(err => {
            console.log(err);
            reject(err);
          })
    });
  }

  removeBizOfProduct(data, person_id) {
    return new Promise((resolve, reject) => {
      (!data.bid) ?
        Promise.reject(error.noBusinessIdDeclare)
        :
        this.sql[personTable].bizRep({bid: data.bid, pid: person_id})
          .then(res => {
            if (res.length < 1)
              return Promise.reject(error.notBizRep);

            if (!data.product_id)
              return Promise.reject(error.noProductId);
            else
              return this.sql[businessProductTable].removeBizProduct({product_id: data.product_id, bid: data.bid});
          })
          .then(resolve)
          .catch(err => {
            console.log(err);
            reject(err);
          });
    })
  }
}

Business.test = false;
module.exports = Business;