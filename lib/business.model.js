const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');
const randomString = require('randomstring');
const Notification = require('./notification.system');

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
                  from: res[0],
                  about: Notification.getNotificationCategory().BusinessUpdateProfile,
                  aboutData: {
                    business_name: res[0].name || res[0].name_fa
                  },
                };

                //ToDo: call push notification method
              });

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
    return this.sql[productTable].getAll();
  }

  getProduct(product_id) {
    return this.sql[productTable].get({product_id: product_id});
  }

  addBusinessProduct(data, person_id) {
    return new Promise((resolve, reject) => {
      let productId = null;
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
            productId = res.product_id;
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
          .then(res => {
            this.sql[tableName].getByBizProductId({bid: data.bid, product_id: productId})
              .then(res => {
                let msg = {
                  from: res[0],
                  about: (data.bpid) ? Notification.getNotificationCategory().BusinessAddProduct : Notification.getNotificationCategory().BusinessUpdateProduct,
                  aboutData: {
                    business_name: res[0].name || res[0].name_fa,
                    product_name: res[0].product_name || res[0].product_name_fa,
                  }
                };

                //ToDo: call push notification method
              });

            resolve(res);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          })
    });
  }

  removeBizOfProduct(data, person_id) {
    return new Promise((resolve, reject) => {
      let businessProductDetails = null;
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
              return this.sql[businessProductTable].getByBizProductId({product_id: data.product_id, bid: data.bid});
          })
          .then(res => {
            businessProductDetails = res[0];
            return this.sql[businessProductTable].removeBizProduct({product_id: data.product_id, bid: data.bid});
          })
          .then(res => {
            let msg = {
              from: businessProductDetails,
              about: Notification.getNotificationCategory().BusinessRemoveProduct,
              aboutData: {
                business_name: businessProductDetails.name || businessProductDetails.name_fa,
                product_name: businessProductDetails.product_name || businessProductDetails.product_name_fa,
              },
            };

            //ToDo: call push notification method

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

  pushingLCENotification(business_id, lce_description, lce_description_fa, isConfirmed = false) {
    this.sql[tableName].get({bid: business_id})
      .then(res => {
        let msg = {
          from: res[0],
          about: isConfirmed ? Notification.getNotificationCategory().BusinessAddLifeCycleEvent : Notification.getNotificationCategory().BusinessRequestLifeCycleEvent,
          aboutData: {
            business_name: res[0].name || res[0].name_fa,
            lce_description: body.description || body.description_fa,
          },
        };

        //ToDo: call push notification method
      });
  }

  setLCE(body, user_id) {
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.getUserAccess(user_id, body.bid1)
        .then(res => {
          if (res.isAdmin || res.isRep) { // biz rep or admin is insert/update lce

            if (!body.id) {    //Insert
              body.is_confirmed = res.isAdmin || !res.oid2;

              this.sql.business_lce.add(body)
                .then(lceId => {
                    if (!res.isAdmin) {
                      if (body.bid2) {
                        this.sql.person.getUserById({pid: user_id}).then(rep1 => { // send email to rep2 about lce request by rep1
                          this.sql.membership.getBizRep({bid: body.bid2}).then(rep2 => {
                            // helpers.sendMail(`LCE request is received by ${rep1[0].username }`, null, 'lce', rep2[0].username).then(() => {
                            // });
                            this.pushingLCENotification(data.bid1, body.description, body.description_fa, body.is_confirmed);
                            resolve(lceId);
                          }).catch(err => reject(err));
                        }).catch(err => reject(err));
                      } else {
                        this.pushingLCENotification(data.bid1, body.description, body.description_fa, body.is_confirmed);
                        resolve(lceId);
                      }
                    }
                    else {
                      this.pushingLCENotification(data.bid1, body.description, body.description_fa, body.is_confirmed);
                      resolve(lceId);
                    }

                  }
                ).catch(err => reject(err))

            }
            else {          //Update
              if (!res.isAdmin) {
                delete body.bid1; // bid1 1 should not be changed during update of lce
                delete body.bid2; // bid2 2 should not be changed during update of lce
                delete body.is_confirmed; // is_confirmed should not change during update of lce
              }
              this.sql.business_lce.update(body, body.id)
                .then(res => {
                  this.sql.business_lce.get({lce_id: body.id})
                    .then(res => this.pushingLCENotification(res[0].bid1, res[0].description, res[0].description_fa, res[0].is_confirmed));
                  resolve(res);
                })
                .catch(err => reject(err));
            }
          }
          else {
            reject(error.notAllowed);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  confirmLCE(user_id, body) {
    return new Promise((resolve, reject) => {
      let businessLCEDetails = null;
      this.getUserAccess(user_id, body.bid).then(res => {
        if (res.isAdmin || res.isRep) { // biz rep or admin is insert/update lce

          if (body.is_confirmed)
            this.sql.business_lce.update({is_confirmed: body.is_confirmed}, body.id).then(res => {
              resolve(res);
            }).catch(err => reject(err));
          else
            this.sql.business_lce.get({id: body.id})
              .then(res => {
                businessLCEDetails = res[0];
                return this.sql.business_lce.delete(body.id);
              })
              .then(res => {
                let msg = {
                  from: businessLCEDetails
                };

                //ToDo: call notification method
                resolve(res);
              }).catch(err => reject(err));
        } else {
          reject(error.notAllowed);
        }
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  deleteLCE(user_id, body) {
    return new Promise((resolve, reject) => {

      this.sql.business_lce.get({id: body.id}).then(lce => {
        this.getUserAccess(user_id, lce[0].bid1).then(res => {


          if (res.isAdmin || res.isRep) { // is admin or rep of first biz
            this.sql.business_lce.delete(body.id).then(() => {
              resolve();
            }).catch(err => reject(err));
          } else {
            this.getUserAccess(user_id, lce[0].bid2).then(res => {
              if (res.isAdmin || res.isRep) { // is admin or rep of second biz
                this.sql.business_lce.delete(body.id).then(() => {
                  resolve();
                }).catch(err => reject(err));
              } else
                reject(error.notAllowed);
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));


    });
  }

  getLCE(user_pid, param_bid) {
    return new Promise((resolve, reject) => {

      if (!param_bid)
        reject(error.noBizId);

      this.getUserAccess(user_pid, param_bid).then(res => {

        if (res.isAdmin || res.isRep) { // rep or admin is not getting biz lce

          return this.sql.business_lce.getAll({bid: param_bid});
        } else {
          return this.sql.business_lce.getConfirmed({bid: param_bid});
        }
      })
        .then(res => resolve(res))
        .catch(err => {
          reject(err);
        });
    });
  }

  getRequestedLCE(user_pid, param_bid) {
    return new Promise((resolve, reject) => {

      this.getUserAccess(user_pid, param_bid).then(res => {
        if (res.isAdmin || res.isUser) { // rep or admin is confirming get lce requests
          this.sql.business_lce.getRequested({bid: param_bid}).then(res => {
            resolve(res);
          }).catch(err => reject(err));

        } else {
          reject(error.notAllowed);
        }
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getUserAccess(user_id, bid) {

    return new Promise((resolve, reject) => {

      let access = {
        isRep: false,
        isAdmin: false
      };

      this.sql[membershipTable].isRepresentativeOrAdmin({pid: user_id, bid: bid, oid: null})
        .then(res => {
          if (res.length === 0) {
            access.isRep = false;
            access.isAdmin = false;
            resolve(access);
          }
          else if (res.length > 1) {
            access.isRep = true;
            access.isAdmin = true;
            resolve(access);
          }
          else if (res.length === 1) {

            access.isAdmin = res[0].is_admin;
            access.isRep = !res[0].is_admin;
            resolve(access);
          }

        }).catch(err => {
        resolve(access)
      });


    });
  }
}

Business.test = false;
module.exports = Business;