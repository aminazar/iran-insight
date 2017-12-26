/**
 * Created by Amin on 04/02/2017.
 */
const sql = require('../sql/index');
const error = require('./errors.list');
const Notification = require('./notification.system');
const Person = require('./person.model');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});

class LCE {

  constructor() {
    this.sql = LCE.test ? sql.test : sql;

  }

  pushingLCENotification(tableName, possessor_id, lce_description, lce_description_fa, isConfirmed = false, other_joiner_id) {

    let key;
    if (tableName === 'organization')
      key = 'oid';
    else if (tableName === 'business')
      key = 'bid';
    let obj = {};
    obj[key] = possessor_id;

    this.sql[tableName].get(obj)
      .then(res => {

        let obj = {lce_description: lce_description || lce_description_fa};
        obj[`${tableName}_name`] = res[0].name || res[0].name_fa;
        obj[`${tableName}_id`] = res[0][key];

        let msg = {
          from: res[0][key],
          about: isConfirmed ?
            (key === 'bid' ?
              NotificationCategory.BusinessAddLifeCycleEvent :
              NotificationCategory.OrganizationAddLifeCycleEvent ) :
            (key === 'bid' ?
                NotificationCategory.BusinessRequestLifeCycleEvent :
                NotificationCategory.OrganizationRequestLifeCycleEvent
            ),
          aboutData: obj,
        };

        if (isConfirmed)
          NF.pushNotification(msg);
        else {
          obj[key] = other_joiner_id;
          NF.pushNotification(msg, obj);
        }
      });
  }

  setLCE(type, user_id, body) {
    return new Promise((resolve, reject) => {
      //Check user accessibility

      let exec;
      if (type === 'organization')
        exec = this.getUserAccess(user_id, null, body.id1);
      else if (type === 'business')
        exec = this.getUserAccess(user_id, body.id1, null);

      exec.then(res => {
        if (res.isAdmin || res.isRep) { // rep or admin is insert/update lce

          if (!body.id) {    //Insert

            if (body.id1 && body.id2 && body.id1 === body.id2)
              return Promise.reject(error.sameLCEIds);

            body.is_confirmed = res.isAdmin;

            this.sql[`${type}_lce`].add(body)
              .then(lceId => {

                  if (!res.isAdmin) {
                    if (body.id2) {
                      this.pushingLCENotification(type, body.id1, body.description, body.description_fa, body.is_confirmed, body.id2);
                      resolve(lceId);
                    } else {
                      this.pushingLCENotification(type, body.id1, body.description, body.description_fa, true, null);
                      resolve(lceId);
                    }
                  }
                  else {
                    this.pushingLCENotification(type, body.id1, body.description, body.description_fa, body.is_confirmed, null);
                    resolve(lceId);
                  }

                }
              ).catch(err => reject(err))

          }
          else {          //Update
            if (!res.isAdmin) {
              delete body.id1; // id1 1 should not be changed during update of lce
              delete body.id2; // id2 2 should not be changed during update of lce
              delete body.is_confirmed; // is_confirmed should not change during update of lce
            }
            this.sql[`${type}_lce`].update(body, body.id)
              .then(res => {
                this.sql[`${type}_lce`].get({lce_id: body.id})
                  .then(res => this.pushingLCENotification(res[0].id1, res[0].description, res[0].description_fa, res[0].is_confirmed, res[0].id2));
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

  confirmLCE(type, user_id, body) {
    return new Promise((resolve, reject) => {
      let lceDetails = null;

      let exec;
      let key;
      if (type === 'organization') {
        key = 'oid';
        exec = this.getUserAccess(user_id, null, body[key]);
      }
      else if (type === 'business') {
        key = 'bid';
        exec = this.getUserAccess(user_id, body[key], null);
      }
      exec.then(res => {
        if (res.isAdmin || res.isRep) { // rep or admin is insert/update lce

          if (body.is_confirmed)
            this.sql[`${type}_lce`].update({is_confirmed: body.is_confirmed}, body.id).then(res => {
              this.sql[`${type}_lce`].getLCEData({id: body.id})
                .then(res => {
                  let obj1 = {}, obj2 = {};
                  obj1[key] = body.id;
                  obj2[`${type}_name`] = res[0].seconder_name || res[0].seconder_name_fa;

                  let msg_confirm = {
                    from: obj1,
                    about: (key === 'bid' ?
                      NotificationCategory.BusinessConfirmLifeCycleEvent :
                      NotificationCategory.OrganizationConfirmLifeCycleEvent),
                    aboutData: obj2
                  };

                  let overall_from = res[0];
                  let obj3 = {};
                  obj2[`${type}_name1`] = res[0].former_name || res[0].former_name_fa;
                  obj2[`${type}_name2`] = res[0].seconder_name || res[0].seconder_name_fa;
                  obj2['lce_description'] = res[0].description || res[0].description_fa;

                  let msg_broadcast = {
                    about: NotificationCategory.TwoBusinessAddLifeCycleEvent,
                    aboutData: obj3
                  };

                  let obj4 = {}, obj5 = {};
                  obj4[key] = res[0].former_id;
                  obj5[key] = res[0].seconder_id;

                  let msg_broadcast_for_former = Object.assign({from: Object.assign(obj4, overall_from)}, msg_broadcast);
                  let msg_broadcast_for_seconder = Object.assign({from: Object.assign(obj5, overall_from)}, msg_broadcast);

                  NF.pushNotification(msg_confirm, obj4);
                  NF.pushNotification(msg_broadcast_for_former);
                  NF.pushNotification(msg_broadcast_for_seconder);
                });

              resolve(res);
            }).catch(err => reject(err));
          else
            this.sql[`${type}_lce`].getLCEData({id: body.id})
              .then(res => {
                lceDetails = res[0];
                return this.sql[`${type}_lce`].delete(body.id);
              })
              .then(res => {
                let obj = {}, obj1 = {};
                obj[`${type}_name`] = lceDetails.seconder_name || lceDetails.seconder_name_fa;
                obj.lce_description = lceDetails.description || lceDetails.description_fa;

                let msg = {
                  from: lceDetails,
                  about: (type === 'business' ?
                    NotificationCategory.BusinessRejectLifeCycleEvent :
                    NotificationCategory.OrganizationRejectLifeCycleEvent)
                  ,
                  aboutData: obj
                };
                obj1[key] = lceDetails.former_id;
                NF.pushNotification(msg, obj1);

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

  deleteLCE(type, user, lceId) {
    return this.sql[`${type}_lce`].getLCEDetail({lceId}).then(lce => {
      let exec, key;
      if (type === 'organization') {
        key = 'oid';
        exec = this.getUserAccess(user.pid, null, lce[0].id1);
      }
      else if (type === 'business') {
        key = 'bid';
        exec = this.getUserAccess(user.pid, lce[0].id1, null);
      }

      return exec.then(res => {
        if (res.isAdmin || res.isRep) { // is admin or rep of first
         return this.sql[`${type}_lce`].delete(lceId).then(data => {
            let obj = {
              admin_name: Person.getPersonFullName(user),
              admin_username: user.username,
              isAdmin: res.isAdmin,
              lce_description: lce[0].description || lce[0].description_fa,
            };
            obj[`${type}_name`] = lce[0].possessor_name || lce[0].possessor_name_fa;
            obj[`${type}_id`] = lce[0].possessor_id;

            let obj1 = {};
            obj1[key] = lce[0].possessor_id;

            let msg = {
              from: (res.isAdmin) ? user.pid : obj1,
              about: (type === 'bisuness' ?
                  NotificationCategory.BusinessRemoveLifeCycleEvent :
                  NotificationCategory.OrganizationRemoveLifeCycleEvent
              ),
              aboutData: obj
            };

            let obj2 = {}, obj3 = {};
            if (res.isAdmin) {
              obj2[key] = lce[0].possessor_id;
              obj3[key] = lce[0].joiner_id;

              NF.pushNotification(msg, obj2);
              if (lce[0].joiner_id)
                NF.pushNotification(msg, obj3);
            }
            else {
              NF.pushNotification(msg);

              if (lce[0].joiner_id)
                NF.pushNotification(msg, obj3);
            }
            return Promise.resolve(data);
          })
        } else {

          let func = null;
          if (type === 'organization')
            func = this.getUserAccess(user.pid, lce[0].id2, null);
          else if (type === 'business')
            func = this.getUserAccess(user.pid, null, lce[0].id2);

          return func.then(res => {
            if (res.isAdmin || res.isRep) { // is admin or rep of second joiner
             return this.sql[`${type}_lce`].delete(lceId).then((data) => {

                let obj1 = {};
                obj1[key] = lce[0].joiner_id;

                let obj2 = {
                  admin_name: Person.getPersonFullName(user),
                  admin_username: user.username,
                  isAdmin: res.isAdmin,
                  lce_description: lce[0].description || lce[0].description_fa,
                };
                obj2[`${type}_id`] = lce[0].joiner_id;
                obj2[`${type}_name`] = lce[0].joiner_name || lce[0].joiner_name_fa;

                let msg = {
                  from: (res.isAdmin) ? user : obj1,
                  about: NotificationCategory.BusinessRemoveLifeCycleEvent,
                  aboutData: obj2
                };

                let obj3 = {}, obj4 = {};
                obj3[key] = lce[0].possessor_id;
                obj4[key] = lce[0].joiner_id;


                if (res.isAdmin) {
                  NF.pushNotification(msg, obj3);
                  if (lce[0].joiner_id)
                    NF.pushNotification(msg, obj4);
                }
                else {
                  NF.pushNotification(msg);
                  NF.pushNotification(msg, obj3);
                }

                return Promise.resolve(data);
              })
            } else
              return Promise.reject(error.notAllowed);
          })
        }
      })

    })
  }

  getLCEList(type, user_pid, param_id, offset = null, limit = null) {

    let exec;
    if (type === 'business')
      exec = this.getUserAccess(user_pid, param_id, null);
    else if (type === 'organization')
      exec = this.getUserAccess(user_pid, null, param_id);

    if (!param_id)
      return Promise.reject(error.noBizId);

    return exec.then(res => {

      if (res.isAdmin || res.isRep) { // rep or admin is getting lce

        return this.sql[`${type}_lce`].getLCEList({possessorId: param_id, condition: 'true = true', offset, limit}); // show all LCE
      } else {
        return this.sql[`${type}_lce`].getLCEList({
          possessorId: param_id,
          condition: 'is_confirmed = true',
          offset,
          limit
        });
      }
    });
  }

  getRequestedLCE(type, user_pid, param_id, offset = null, limit = null) {

    let exec;
    if (type === 'business')
      exec = this.getUserAccess(user_pid, param_id, null);
    else if (type === 'organization')
      exec = this.getUserAccess(user_pid, null, param_id);

    return exec.then(res => {
      if (res.isAdmin || res.isUser) { // rep or admin is confirming get lce requests
        return this.sql[`${type}_lce`].getLCEList({
          possessorId: param_id,
          condition: `id2 = ${param_id} and is_confirmed = false `,
          offset,
          limit
        }); // show all LCE
      } else {
        return Promise.reject(error.notAllowed);
      }
    })
  }

  getLCEDetail(type, user_pid, param_id, lceId) {

    let exec;
    if (type === 'business')
      exec = this.getUserAccess(user_pid, param_id, null);
    else if (type === 'organization')
      exec = this.getUserAccess(user_pid, null, param_id);

    if (!param_id)
      return Promise.reject(error.noBizId);

    return this.sql[`${type}_lce`].getLCEDetail({possessorId: param_id, lceId}).then(res => {

      return exec.then(access => {

        if (!res[0].active) {
          if (access.isRep || access.isAdmin)
            return Promise.resolve(res);
          else
            return Promise.reject(error.notAllowed);
        } else
          return Promise.resolve(res);

      });
    });
  }

  getUserAccess(user_id, bid = null, oid = null) {

    return new Promise((resolve, reject) => {

      let access = {
        isRep: false,
        isAdmin: false
      };

      this.sql.membership.isRepresentativeOrAdmin({pid: user_id, bid: bid, oid: oid})
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

module
  .exports = LCE;