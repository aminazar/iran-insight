const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});

const Person = require('./person.model');
const moment = require('moment');

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
          if (data.bid)
            this.sql[tableName].get({bid: data.bid})
              .then(res => {
                let msg = {
                  from: res[0].bid,
                  about: NotificationCategory.BusinessUpdateProfile,
                  aboutData: {
                    business_name: res[0].name || res[0].name_fa,
                    business_id: res[0].bid,
                  },
                };

                NF.pushNotification(msg);
              });

          resolve(res);
        })
        .catch(err => {
          reject(err);
        })
    });
  }

  getAllProducts() {
    return this.sql[productTable].getAll();
  }

  getProduct(product_id) {
    return this.sql[productTable].get({product_id: product_id});
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

  addBusinessProduct(business_id, data, person_id) {
    data.business_id = business_id;

    return new Promise((resolve, reject) => {
      (!business_id) ?
        Promise.reject(error.noBusinessIdDeclare)
        :
        this.sql[personTable].isAdmin({pid: person_id})
          .then(res => {
            if (res.length > 0)          // Means person is admin
              return Promise.resolve();
            else
              return this.sql[personTable].bizRep({bid: business_id, pid: person_id})
                .then(res => {
                  if (res.length > 0)
                    return Promise.resolve();

                  return Promise.reject(error.notBizRep);
                });
          })
          .then(() => {
            if (!data)
              return Promise.reject(error.noProductDeclare);
            else
              return this.addProduct(data);
          })
          .then(res => {
            this.sql[productTable].getByProductId({product_id: res.product_id})
              .then(res => {
                let msg = {
                  from: res[0].business_id,
                  about: NotificationCategory.BusinessAddProduct,
                  aboutData: {
                    business_name: res[0].name || res[0].name_fa,
                    product_name: res[0].name || res[0].name_fa,
                    business_id: res[0].bid,
                  }
                };

                NF.pushNotification(msg);
              });

            resolve(res);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          })
    });
  }

  removeBizOfProduct(business_id, product_id, person_id) {
    return new Promise((resolve, reject) => {
      let businessProductDetails = null;
      (!business_id) ?
        Promise.reject(error.noBusinessIdDeclare)
        :
        this.sql[personTable].isAdmin({pid: person_id})
          .then(res => {
            if (res.length > 0)          // Means person is admin
              return Promise.resolve();
            else
              return this.sql[personTable].bizRep({bid: business_id, pid: person_id})
                .then(res => {
                  if (res.length > 0)
                    return Promise.resolve();

                  return Promise.reject(error.notBizRep);
                });
          })
          .then(() => {
            if (!product_id)
              return Promise.reject(error.noProductId);
            else
              return this.sql[productTable].getByProductId({product_id: product_id});
          })
          .then(res => {
            businessProductDetails = res[0];
            return this.sql[productTable].update({end_time: new Date()}, product_id);
          })
          .then(res => {
            let msg = {
              from: businessProductDetails.bid,
              about: NotificationCategory.BusinessRemoveProduct,
              aboutData: {
                business_name: businessProductDetails.name || businessProductDetails.name_fa,
                product_name: businessProductDetails.product_name || businessProductDetails.product_name_fa,
                business_id: businessProductTable.bid,
              },
            };

            NF.pushNotification(msg);

            resolve(res);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
    })
  }

  updateProduct(business_id, product_id,data, person_id) {
    return new Promise((resolve, reject) => {
      (!business_id) ?
        Promise.reject(error.noBusinessIdDeclare)
        :
        this.sql[personTable].isAdmin({pid: person_id})
          .then(res => {
            if (res.length > 0)          // Means person is admin
              return Promise.resolve();
            else
              return this.sql[personTable].bizRep({bid: business_id, pid: person_id})
                .then(res => {
                  if (res.length > 0)
                    return Promise.resolve();

                  return Promise.reject(error.notBizRep);
                });
          })
          .then(() => {
            if (!data)
              return Promise.reject(error.noProductDeclare);
            else
              return this.sql[productTable].update(data,product_id)
          })
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
    })

  }

  getAllBusinessProducts(business_id) {
    return this.sql[businessProductTable].getAllProducts({bid: business_id});
  }

  getOne(params) {
    return this.sql[tableName].getOne(params)
      .then(res => {
        return Promise.resolve(res[0]);
      });
    return this.sql[tableName].getOne(params);
  }

  getOneAll(params) {
    let data;
    return this.db.task(t => this.sql[tableName].getOne(params, t)
      .then(res => {
        data = res;
        params.oid = null;
        return this.sql.membership.getOrgBizMembers(params, t)
      })
      .then(res => {
        data.members = res;
        return Promise.resolve(data);
      }));
  }
}

Business.test = false;
module.exports = Business;
