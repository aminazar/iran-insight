/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');
const randomString = require('randomstring');
const moment = require('moment');
const rp = require('request-promise');
const Notification = require('./notification.system');
const path = require('path');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});

let tableName = 'person';
let personActivationLinkTable = 'person_activation_link';
let membershipTable = 'membership';
let associationTable = 'association';
let organizationTable = 'organization';
let businessTable = 'business';
let personExpertiseTable = 'person_expertise';
let subscriptionTable = 'subscription';
let idColumn = 'pid';
let personColumns = [
  'pid',
  'firstname_en',
  'firstname_fa',
  'surname_en',
  'surname_fa',
  'username',
  'secret',
  'image',
  'address_en',
  'address_fa',
  'phone_no',
  'mobile_no',
  'birth_date',
  'is_user',
  'display_name_en',
  'display_name_fa',
  'notify_period',
];
let baseLink = 'https://iran-insight.com';

class Person extends SqlTable {
  constructor(test = Person.test) {
    Person.test = test;
    super(tableName, idColumn, test, personColumns);
  }

  load(username, password) {
    this.password = password;
    this.username = username.toLowerCase();
    return super.load({username: this.username});
  }

  getDataToExport(password = null) {
    let exprt = {};

    personColumns.forEach(el => {
      if (el === 'secret' && password !== null)
        exprt[el] = password;
      else if (el === 'username' && this[el])
        exprt[el] = this[el].toLowerCase();
      else if (this[el] !== null && this[el] !== undefined) {
        exprt[el] = this[el];
      }
    });

    return exprt;
  }

  importData(data) {
    personColumns.forEach(el => {
      if (data[el])
        this[el] = data[el];
    });

    this.is_admin = this.username && helpers.adminCheck(this.username);
  }

  exportData() {
    return new Promise((resolve, reject) => {
      if (!this.password) {
        // if(!this.username)
        //   reject(error.emptyUsername);
        // else
        resolve(this.getDataToExport());
      }
      else {
        env.bcrypt.genSalt(101, (err, salt) => {
          if (err)
            reject(err);
          else
            env.bcrypt.hash(this.password, salt, null, (err, hash) => {
              if (err)
                reject(err);
              else
                this.secret = hash;

              resolve(this.getDataToExport(hash));
            });
        });
      }
    });
  }

  checkPassword() {
    return new Promise((resolve, reject) => {
      if (!this.secret)
        reject(error.noPass);
      env.bcrypt.compare(this.password, this.secret, (err, res) => {
        if (err)
          reject(err);
        else if (!res)
          reject(error.badPass);
        else
          resolve();
      });
    });
  }

  loginCheck(username = this.username, password = this.password) {
    return new Promise((resolve, reject) => {
      this.load(username, password)
        .then(() => this.checkPassword().then(() => {
          // TODO: enable below with socket
          // Person.setNamespace(username);
          resolve();
        }).catch(err => reject(error.badPass)))
        .catch(err => reject(error.noUser));
    })
  }

  insert(data) {
    this.importData(data);
    this.password = data.password;
    return this.save();
  }

  insertAdmin(pid) {
    let curSql = Person.test ? sql.test : sql;
    return curSql.administrators.add({pid});
  }

  update(pid, data) {
    this.importData(data);
    this.pid = pid;
    if (data.password)
      this.password = data.password;
    return this.save();
  }

  completeAuth(link, data) {
    if (!data.password)
      return Promise.reject(error.noPass);

    if (!data.username)
      return Promise.reject(error.emptyUsername);

    return new Promise((resolve, reject) => {
      let pid = null;

      this.sql[personActivationLinkTable].getByLink({link: link, username: data.username})
        .then(res => {
          if (res.length === 0)
            reject(error.expiredLink);
          else {
            data.is_user = true;
            delete data.username;
            return this.update(res[0].pid, data);
          }
        })
        .then(res => {
          pid = res;
          return this.sql[personActivationLinkTable].deleteByPID({pid: pid});
        })
        .then(res => resolve(pid))
        .catch(err => reject(err));
    });
  }

  introduceAsRep(data, person) {
    if ((data.bid === null || data.bid === undefined) && (data.oid === null || data.oid === undefined))
      return Promise.reject(error.noBizOrOrgDeclared);

    let db = Person.test ? env.testDb : env.db;

    return new Promise((resolve, reject) => {
      let relatedFunction = null;
      let isBiz = false;
      let mid = null;
      let biz_org_data = null;

      if ((data.bid === null || data.bid === undefined) && (data.oid !== null && data.oid !== undefined)) {
        relatedFunction = this.sql[membershipTable].getOrgRep({oid: parseInt(data.oid)});
        isBiz = false;
      }
      else {
        relatedFunction = this.sql[membershipTable].getBizRep({bid: parseInt(data.bid)});
        isBiz = true;
      }

      relatedFunction
        .then(res => {
          if (res.length > 0)
            return Promise.reject(error.hasRepresentative);
          else {
            //Set association and membership
            return db.tx(t => {
              return t.one('insert into association (pid, bid, oid, start_date, end_date) ' +
                'values($1, $2, $3, $4, $5) returning aid', [
                person.pid,
                (data.bid) ? data.bid : null,
                (data.oid) ? data.oid : null,
                (data.start_date) ? data.start_date : moment.utc(new Date()).format(),
                (data.end_date) ? data.end_date : null
              ])
                .then(res => {
                  return t.batch([
                    t.one('insert into membership(assoc_id, is_active, is_representative, position_id) ' +
                      'values($1, $2, $3, $4) returning mid', [
                      res.aid,
                      false,
                      true,
                      (data.position_id) ? data.position_id : null
                    ])
                  ]);
                })
            })
          }
        })
        .then(res => {
          mid = res[0].mid;
          //Get business or organization name
          if (isBiz)
            return this.sql[businessTable].get({bid: data.bid});

          return this.sql[organizationTable].getById({oid: data.oid});
        })
        .then(res => {
          biz_org_data = res[0];
          return this.sql[tableName].getAdmins();
        })
        .then(res => {
          let msg = {
            from: person,
            about: NotificationCategory.IntroducingRep,
            aboutData: {
              person_name: Person.getPersonFullName(person),
              orgBiz_name: isBiz ? biz_org_data.name : biz_org_data.org_name,
              person_username: person.username,
            }
          };
          res.forEach(el => NF.pushNotification(msg, {pid: el.pid}));
          resolve(mid);
        })
        .catch(err => reject(err));
    });
  }

  whichPerson(dest_person_id, actor_id, business_id = null, organization_id = null) {
    return new Promise((resolve, reject) => {
      let result = {
        isAdmin: false,
        isRep: false,
        isUser: true,
      };

      Promise.resolve()
        .then(() => {
          if (dest_person_id !== actor_id)
            return this.sql[membershipTable].isRepresentativeOrAdmin({
              pid: actor_id,
              bid: business_id,
              oid: organization_id
            });
          else
            return Promise.resolve();
        })
        .then((res) => {
          if (dest_person_id === actor_id)
            resolve({
              isAdmin: false,
              isRep: false,
              isUser: true,
            });
          else if (dest_person_id && res.length < 1)
            return Promise.reject(error.notAllowed);
          else if (!dest_person_id && res.length < 1)
            return Promise.reject(error.noId);
          else
            resolve({
              isRep: !res[0].is_admin,
              isAdmin: res[0].is_admin,
              isUser: false,
            });
        })
        .catch(err => reject(err));
    });
  }

  setProfile(actor, data) {
    return new Promise((resolve, reject) => {
      let isRep = false;
      let isAdmin = false;

      this.whichPerson(data.pid ? parseInt(data.pid) : null, actor.pid, data.bid ? data.bid : null, data.oid ? data.oid : null)
        .then((res) => {
          isRep = res.isRep;
          isAdmin = res.isAdmin;
          if (isRep) {
            if (data.pid)
              return Promise.reject(error.modifyNotAllowed);

            personColumns.forEach(el => {
              if (el !== 'username' && el !== 'display_name_en' && el !== 'display_name_fa')
                delete data[el];
            });
            data.is_user = false;

            let new_person_id = null;
            let db = Person.test ? env.testDb : env.db;

            return this.saveData(data)
              .then(res => {
                return db.tx(t => {
                  new_person_id = res;
                  return t.one('insert into association (pid, bid, oid, start_date, end_date) ' +
                    'values($1, $2, $3, $4, $5) returning aid', [
                    res,
                    (data.bid) ? data.bid : null,
                    (data.oid) ? data.oid : null,
                    (data.start_date) ? data.start_date : moment.utc(new Date()).format(),
                    (data.end_date) ? data.end_date : null
                  ])
                    .then(res => {
                      return t.batch([
                        t.one('insert into membership(assoc_id, is_active, is_representative, position_id) ' +
                          'values($1, $2, $3, $4) returning mid', [
                          res.aid,
                          true,
                          false,
                          (data.position_id) ? data.position_id : null
                        ])
                      ]);
                    })
                    .then(res => Promise.resolve(new_person_id));
                })
              })
          }
          else {
            //Should add user if current user is admin
            if (!data.pid && isAdmin) {
              data.is_user = false;
              data.password = null;
              return this.saveData(data);
            }
            else if (!data.pid && !isAdmin)
              return Promise.reject(error.noId);
            else {
              //Ignore username and is_user to change
              delete data.is_user;
              delete data.username;

              return this.saveData(data, data.pid);
            }
          }
        })
        .then((res) => {
          let msg = {
            from: actor.pid,
            about: NotificationCategory.UserUpdateProfile,
            aboutData: {
              person_name: Person.getPersonFullName(actor),
              person_username: actor.username,
              person_id: actor.pid,
            }
          };

          NF.pushNotification(msg);
          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  setExpertise(user, body) {
    if (!body.pid)
      return Promise.reject(error.noId); // pid must be declared in req body to determine which user is changing
    else {
      let expertise = body.expertise;

      return this.getUserAccess(user.pid, body.pid).then(res => {
        if (res.isAdmin || res.isUser) { // user himself is insert/update his expertise or admin is doing that

          if (!expertise.expertise_id) { // add new expertise
            return this.sql.expertise.add(expertise);
          }
          else if (Object.keys(expertise).length === 1 && expertise.expertise_id)            //Expertise object has only expertise_id when assigning expertise to a person
            return Promise.resolve({expertise_id: expertise.expertise_id});
          else { // update expertise
            return this.sql.expertise.update(expertise, expertise.expertise_id)
          }
        } else {
          return Promise.reject(error.notAllowed);
        }
      }).then(res => {
        let pe = {pid: body.pid, expertise_id: res.expertise_id ? res.expertise_id : res[0].expertise_id}; // update returns anonymous result whereas add returns array

        if (body.peid)    //Update person_expertise connection
          return this.sql.person_expertise.update(pe, body.peid);
        else  //Insert new person_expertise connection
          return this.sql.person_expertise.add(pe);
      })
        .then(res => {
          let msg = {
            from: user.pid,
            about: NotificationCategory.UserAddExpertise,
            aboutData: {
              person_name: Person.getPersonFullName(user),
              expertise_name: body.expertise.name_en ? body.expertise.name_en : body.expertise.name_fa,
              person_username: user.username,
              person_id: user.pid,
            }
          };

          NF.pushNotification(msg);
          return Promise.resolve(res);
        });
    }
  }

  getExpertise(user_pid, param_pid) {
    return this.sql.person.getPersonExpertise({pid: param_pid});
  }

  deleteExpertise(user, pid, expertise_id) {
    return new Promise((resolve, reject) => {
      console.log('user ', user);
      this.getUserAccess(user.pid, pid).then(res => {

        if (!res.isAdmin && !res.isUser)
          return Promise.reject(error.notAllowed);

        if (!expertise_id)
          return Promise.reject(error.noExpertiseId);

        return this.sql.person.deleteExpertiseById({expertise_id: expertise_id, pid: pid});

      }).then(res => {
        let msg = {
          from: user.pid,
          about: NotificationCategory.UserRemoveExpertise,
          aboutData: {
            person_name: Person.getPersonFullName(user),
            aboutData: expertise_id,
            person_username: user.username,
            person_id: user.pid,
          }
        };

        NF.pushNotification(msg);
        resolve(res);
      }).catch(err => {
        reject(err);
      });


    });
  }

  setPartnership(user, body) {
    return this.getUserAccess(user.pid, body.pid1).then(res => {
      if (res.isAdmin || res.isUser) { // user himself is insert/update his expertise or admin is doing that
        if (!body.pid1) // pid must be declared in req body to determine which user is changing
          return Promise.reject(error.noId);

        if (!body.id) { // Insert

          if (!body.pid2)
            return Promise.reject(error.noId);

          body.is_confirmed = res.isAdmin;

          return this.sql.partnership.add(body)
            .then(data => {
              if (!res.isAdmin) {
                let msg = {
                  from: user,
                  about: NotificationCategory.PersonRequestPartnership,
                  aboutData: {
                    person_name: Person.getPersonFullName(user),
                    partnership_description: (body.description ? body.description : body.description_fa),
                    person_username: user.username,
                  }
                };

                NF.pushNotification(msg, {pid: body.pid2});
                // helpers.sendMail(`partnership request is received by ${person1[0].username }`, null, 'partnership', person2[0].username).then(() => {
                // });
                return Promise.resolve(data);
              }
              else
                return Promise.resolve(data);
            })

        }
        else { // update

          if (!res.isAdmin) {
            delete body.pid1; // pid 1 should not be changed during update of partnership
            delete body.pid2; // pid 2 should not be changed during update of partnership
            delete body.is_confirmed; // is_confirmed should not change during update of partnership
          }
          return this.sql.partnership.update(body, body.id).then(data => {
            return Promise.resolve(data);

          });
        }
      } else {
        return Promise.reject(error.notAllowed);
      }
    })
  }

  confirmPartnership(user, body) {
    let updateId = null;
    let partnershipDetails = null;
    return this.getUserAccess(user.pid, body.pid2)
      .then(res => {
        if (res.isAdmin || res.isUser) { // user himself or admin is confirming a partnership
          if (body.is_confirmed)
            return this.sql.partnership.update({is_confirmed: body.is_confirmed}, body.id)
              .then(res => {
                updateId = res;
                return this.sql.partnership.getPartnershipDetail({id: body.id});
              })
              .then(res => {
                let msg = {
                  from: user,
                  about: NotificationCategory.PersonConfirmPartnership,
                  aboutData: {
                    person_name: Person.getPersonFullName(user),
                    person_username: user.username,
                  }
                };

                let msg_broadcast = {
                  from: res[0],
                  about: NotificationCategory.PeopleAddPartnership,
                  aboutData: {
                    person_name1: (res[0].possessor_display_name_en || res[0].possessor_display_name_fa),
                    person_name2: (res[0].joiner_display_name_en || res[0].joiner_display_name_fa),
                    partnership_description: res[0].description || res[0].description_fa,
                    person_username1: res[0].possessor_username,
                    person_username2: res[0].joiner_username,
                  }
                };

                NF.pushNotification(msg, {pid: res[0].possessor_id});
                NF.pushNotification(msg_broadcast);

                return Promise.resolve(updateId)
              })
              .catch(err => reject(err));
          else
            return this.sql.partnership.getPartnershipDetail({id: body.id})
              .then(res => {
                partnershipDetails = res[0];
                return this.sql.partnership.delete(body.id);
              })
              .then(res => {
                let msg = {
                  from: user,
                  about: NotificationCategory.PersonRejectPartnershipRequest,
                  aboutData: {
                    person_name: Person.getPersonFullName(user),
                    partnership_description: partnershipDetails.description ? partnershipDetails.description : partnershipDetails.description_fa,
                    person_username: user.username,
                  }
                };

                NF.pushNotification(msg, {pid: partnershipDetails.possessor_id});

                return Promise.resolve(res)
              })
        } else {
          return Promise.reject(error.notAllowed);
        }
      })
  }

  deletePartnership(user, param_id) {
    if (!param_id)
      return Promise.reject(error.noPartnershipId);

    return this.sql.partnership.getPartnershipDetail({id: param_id}).then(partnership => {
      return this.getUserAccess(user.pid, partnership[0].possessor_id).then(res => {
        if (res.isAdmin || res.isUser) { // pid1 is deleting partnership

          return this.sql.partnership.delete(param_id)
            .then(data => {
              let msg = {
                from: user,
                about: NotificationCategory.PersonRemovePartnership,
                aboutData: {
                  person_name: Person.getPersonFullName(user),
                  partnership_description: partnership[0].description ? partnership[0].description : partnership[0].description_fa,
                  person_username: user.username,
                }
              };

              NF.pushNotification(msg, {pid: partnership[0].joiner_id});
              NF.pushNotification(msg);

              return Promise.resolve(data);
            })
        } else {
          return this.getUserAccess(user.pid, partnership[0].joiner_id).then(res => {
            if (res.isAdmin || res.isUser) { // pid2 is deleting partnership

              return this.sql.partnership.delete(param_id)
                .then(data => {
                  let msg = {
                    from: user,
                    about: NotificationCategory.PersonRemovePartnership,
                    aboutData: {
                      person_name: Person.getPersonFullName(user),
                      partnership_description: partnership[0].description ? partnership[0].description : partnership[0].description_fa,
                      person_username: user.username,
                    }
                  };

                  NF.pushNotification(msg, {pid: partnership[0].joiner_id});
                  NF.pushNotification(msg);

                  return Promise.resolve(data);
                })
            } else {
              return Promise.reject(error.notAllowed);
            }
          })
        }
      })
    })
  }

  getPartnershipList(user_pid, param_pid, offset, limit) {
    return new Promise((resolve, reject) => {

      if (!param_pid)
        reject(error.noId);

      this.getUserAccess(user_pid, param_pid).then(res => {

        if (res.isAdmin || res.isUser) { // user him/her self or admin is not getting user partnership
          return this.sql.partnership.getPartnershipList({pid: param_pid, condition: 'true = true', offset, limit});
        } else {
          return this.sql.partnership.getPartnershipList({
            pid: param_pid,
            condition: 'is_confirmed = true',
            offset,
            limit
          });
        }
      })
        .then(res => resolve(res))
        .catch(err => {
          reject(err);
        });
    });
  }

  getPartnershipDetail(user_pid, param_id) {

    if (!param_id)
      return Promise.reject(error.noId);

    return this.sql.partnership.getPartnershipDetail({id: param_id}).then(data => {

      return this.getUserAccess(user_pid, data[0].possessor_id).then(res => {
        if (res.isAdmin || res.isUser) { // possessor is getting his/her partnership
          return Promise.resolve(data);
        } else {
          return this.getUserAccess(user_pid, data[0].joiner_id).then(res => {
            if (res.isAdmin || res.isUser)  // joiner is getting his/her partnership
              return Promise.resolve(data);
            else
              return Promise.reject(error.notAllowed);
          });
        }
      })
    })
  }

  getRequestedPartnership(user_pid) {
    return new Promise((resolve, reject) => {

      if (!user_pid)
        reject(error.notAllowed);
      return this.sql.partnership.getRequestedById({pid: user_pid}).then(res => {
        resolve(res);
      });
    });
  }

  changeNotifyType(user_pid, body) {
    return new Promise((resolve, reject) => {


      this.getUserAccess(user_pid, body.pid).then(res => {


        if (res.isAdmin || res.isUser) { // user himself is change his/her notify type
          if (!body.pid) // pid must be declared in req body to determine which user is changing
            return Promise.reject(error.noId);

          if (!body.notify_period) // notify_type must be declared in req body
            return Promise.reject(error.noNotifyType);

          if (body.notify_period !== Notification.notificationType.Never &&
            body.notify_period !== Notification.notificationType.Daily &&
            body.notify_period !== Notification.notificationType.Weekly
            && body.notify_period !== Notification.notificationType.Instantly) // valid notify_types are => d: daily, w: weekly, n: never, i: instantly
            return Promise.reject(error.incorrectNotifyType);// incorrect notify_type

          this.sql.person.update({notify_period: body.notify_period}, body.pid).then(res => {
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

  unsubscribe(user_pid, hash) {

    return this.sql.person.get({pid: user_pid})
      .then(res => {

        if (res.length === 0)
          return Promise.reject(error.noUser);

        if (Person.getUserUnsubscribeHash(res[0]) !== hash)
          return Promise.reject(error.notAllowed);


        return this.sql.person.update({notify_period: Notification.notificationType.Never}, user_pid);
      })
  }

  static getUserUnsubscribeHash(person) {
    return person.secret.substring(0, 5);
  }

  getUserAccess(user_pid, dest_pid) {

    return new Promise((resolve, reject) => {

      let access = {
        isUser: false,
        isAdmin: false
      };
      this.sql.person.getUserById({pid: user_pid, is_user: true}).then(res => {
        if (res && res.length > 0) {
          access.isUser = +user_pid === +dest_pid;
        }
        else
          return Promise.reject(error.noUser);

        return this.sql.administrators.getById({pid: user_pid});
      })
        .then(res => {
          if (res && res.length > 0)
            access.isAdmin = true;

          resolve(access);
        })
        .catch(err => {
          reject(err);
        });


    });
  }

  getPersonInfo(caller_id, person_id) {
    return new Promise((resolve, reject) => {
      let isAdmin = false;
      this.getUserAccess(caller_id, person_id)
        .then(res => {
          isAdmin = res.isAdmin;
          return this.sql[tableName].getUserById({pid: person_id, is_user: res.isAdmin ? null : true});
        })
        .then(res => {
          if (res.length > 0) {
            delete res[0].secret;

            // if (!isAdmin)
            //   delete res[0].notify_period;
          }

          resolve(res);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        })
    });
  }

  followingEntity(subscriber_id, pid, bid, oid) {
    if (!pid && !bid && !oid)
      return Promise.reject(error.badDataInRequest);
    return this.sql[subscriptionTable].add({
      subscriber_id: subscriber_id,
      pid: pid,
      bid: bid,
      oid: oid,
    });
  }

  unfollowingEntity(subscriber_id, pid, bid, oid) {
    if (pid)
      return this.sql[subscriptionTable].unsubscribePerson({subscriber_id: subscriber_id, pid: pid});
    else if (bid)
      return this.sql[subscriptionTable].unsubscribeBiz({subscriber_id: subscriber_id, bid: bid});
    else if (oid)
      return this.sql[subscriptionTable].unsubscribeOrg({subscriber_id: subscriber_id, oid: oid});

    return Promise.reject(error.badDataInRequest);
  }

  setProfileImage(user_pid, pid, fileData) {
    return new Promise((resolve, reject) => {
      //Check user accessibility to set profile image
      this.getUserAccess(user_pid, pid)
        .then(res => {
          if (!res.isAdmin && !res.isUser)
            return Promise.reject(error.notAllowed);

          const tempFilePath = fileData.path.replace(/\\/g, '/');
          return this.saveData({image: tempFilePath.substr(tempFilePath.indexOf('public') + 6)}, pid);
        })
        .then(res => {
          resolve('');
        })
        .catch(err => {
          console.error('Cannot update profile image of user ' + pid + ' into database');
          console.error(err);
          reject(err);
        });
    });
  }

  getProfileImage(pid) {
    return new Promise((resolve, reject) => {
      this.sql[tableName].getUserById({pid: pid, is_user: null})
        .then(res => {
          if(res.length > 0 && res[0].image)
            resolve(env.appAddress + '/' + res[0].image);
          else
            resolve(null);
        })
        .catch(err => {
          console.error('Cannot get user details by id = ' + pid);
          reject(err);
        });
    });
  }

  deleteProfileImage(user_pid, pid) {
    return new Promise((resolve, reject) => {
      //Check user accessibility to set profile image
      this.getUserAccess(user_pid, pid)
        .then(res => {
          if (!res.isAdmin && !res.isUser)
            return Promise.reject(error.notAllowed);

          return this.saveData({image: ''}, pid);
        })
        .then(res => {
          resolve('');
        })
        .catch(err => {
          console.error('Cannot delete profile image of user ' + user_pid + ' from database');
          reject(err);
        });
    });
  }

  static adminCheck(adminOnly, user, isTest = false) {
    return new Promise((resolve, reject) => {
      if (adminOnly) {
        if (user)
          resolve((isTest ? sql.test : sql).person.isAdmin({pid: user.pid}));
        else
          reject(error.adminOnly);
      }

      resolve();
    })
  }

  static serialize(person, done) {
    done(null, person);
  }

  static deserialize(req, person, done) {
    let personInstance = new Person(req.app.get('env') === 'development' ? req.query.test === 'tEsT' : false);
    personInstance.username = person.username;
    personInstance.password = person.password;

    if (!person.googleAuth && !person.facebookAuth && !person.linkedinAuth)
      personInstance.loginCheck()
        .then(() => done(null, person))
        .catch(err => {
          console.log(err.message);
          done(err);
        });
    else {
      if (person.googleAuth) {
        console.log('Token is: ', person.googleAuth);
        rp({
          method: 'get',
          uri: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + person.googleAuth,
        })
          .then(res => {
            done(null, person);
          })
          .catch(err => {
            done(err);
          });
      }
      else if (person.facebookAuth) {
        rp({
          method: 'get',
          uri: 'https://graph.facebook.com/debug_token?input_token=' + person.facebookAuth + '&access_token=' + '3a104bcdac0616c5f0567c9bbd5dd332',
          json: true,
        })
          .then(res => {
            if (res.data.is_valid)
              done(null, person);
            else
              done('Invalid user');
          })
          .catch(err => {
            done(err);
          });
      }
      else if (person.linkedinAuth) {
        rp({
          method: 'get',
          uri: 'https://api.linkedin.com/v1/people/~?oauth2_access_token=' + person.linkedinAuth,
          json: true,
        })
          .then(res => {
            done(null, person);
          })
          .catch(err => {
            done(err);
          })
      }
    }
  }

  static passportLocalStrategy(req, username, password, done) {
    let person = new Person(req.app.get('env') === 'development' ? req.query.test === 'tEsT' : false);
    person.loginCheck(username, password)
      .then(() => done(null, person))
      .catch(err => done(err, false));
  }

//Detect given phrase is in persian or english
  static detectLanguage(phrase) {
    if (phrase && phrase.charCodeAt(0) >= 141 && phrase.charCodeAt(0) <= 254)
      return 'fa';
    else
      return 'en';
  }

  static passportOAuthStrategy(req, token, refreshToken, profile, done) {
    let person = new Person(req.test);

    if (profile.provider.toLowerCase() == 'google') {
      person.googleAuth = token;
      person.facebookAuth = null;
      person.linkedinAuth = null;
    }
    else if (person.provider.toLowerCase() == 'facebook') {
      person.googleAuth = null;
      person.facebookAuth = token;
      person.linkedinAuth = null;
    }
    else if (person.provider.toLowerCase() == 'linkedin') {
      person.googleAuth = null;
      person.facebookAuth = null;
      person.linkedinAuth = token;
    }

    let displayName = {fa: null, en: null};
    if (profile.displayName) {
      displayName.en = Person.detectLanguage(profile.displayName) === 'en' ? profile.displayName : null;
      displayName.fa = Person.detectLanguage(profile.displayName) === 'fa' ? profile.displayName : null;
    }
    else {
      displayName.en = Person.detectLanguage(profile.name.givenName) === 'en' ? profile.name.givenName + ' ' + profile.name.familyName : null;
      displayName.fa = Person.detectLanguage(profile.name.givenName) === 'fa' ? profile.name.givenName + ' ' + profile.name.familyName : null;
    }

    let data = {
      username: profile.emails[0].value,
      password: null,
      firstname_en: Person.detectLanguage(profile.name.givenName) === 'en' ? profile.name.givenName : null,
      firstname_fa: Person.detectLanguage(profile.name.givenName) === 'fa' ? profile.name.givenName : null,
      surname_en: Person.detectLanguage(profile.name.familyName) === 'en' ? profile.name.familyName : null,
      surname_fa: Person.detectLanguage(profile.name.familyName) === 'fa' ? profile.name.familyName : null,
      display_name_en: displayName.en,
      display_name_fa: displayName.fa,
      is_user: true
    };

    let curSql = Person.test ? sql.test : sql;

    curSql[tableName].get({username: data.username})
      .then(res => {
        if (res && res.length > 0)
          person.update(res[0].pid, data)
            .then(res => done(null, person))
            .catch(err => done(err, null));
        else
          person.insert(data)
            .then(res => done(null, person))
            .catch(err => done(err, null));
      })
      .catch(err => {
        console.log(err);
        done(err, null);
      });
  }

  static afterLogin(user) {
    const curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      // Person.setNamespace(username);
      curSql[tableName].isAdmin({pid: user.pid})
        .then(res => {
          resolve({
            username: user.username,
            userType: (res && res.length > 0) ? 'admin' : 'user',
            pid: user.pid,
            displayName: user.display_name_en || user.display_name_fa,
          });
        })
        .catch(err => {
          reject(err);
        });
    })
  }

  // TODO: enable below with socket
  // static setNamespace(username) {
  //   socket.storeNamespace((username === `admin@${env.appName}` ? 'admin' : 'user') + '/' + username);
  // }

  static checkMailCorrectness(mail) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(mail);
  }

  static generateActivationLink(person_id) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let rndStr = '';

      curSql[personActivationLinkTable].select()
        .then(res => {
          let dt = res ? res.map(el => el.link) : [];

          do {
            rndStr = randomString.generate({
              length: 80,
              charset: 'alphanumeric'
            });
          }
          while (dt.includes(rndStr));

          return curSql[personActivationLinkTable].add({
            pid: person_id,
            link: rndStr
          });
        })
        .then(res => resolve(rndStr))
        .catch(err => {
          reject(err);
        })
    })
  }

  static sendActivationMail(email, isForgotMail, person_id, display_name) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let displayName = display_name;
      let pid = null;
      Promise.resolve()
        .then(() => {
          if (person_id) {
            pid = person_id;
            return Promise.resolve();
          }
          else
            return curSql[tableName].get({username: email});
        })
        .then(res => {
          if (person_id)
            return Person.generateActivationLink(pid);
          else if (res && res.length > 0) {
            displayName = Person.getPersonFullName(res[0]) !== ' ' ? Person.getPersonFullName(res[0]) : ((res[0].display_name_en) ? res[0].display_name_en : res[0].display_name_fa);
            pid = parseInt(res[0].pid);
            return Person.generateActivationLink(pid);
          }

          return Promise.reject(error.notRegister);
        })
        .then(res => {
          let mailContent = Person.composeActivationMail(displayName, res, isForgotMail);
          return helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, mailContent.subject, email);
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static composeActivationMail(name, activate_link, isForgotMail = false) {
    let link = baseLink + '/login/activate/' + activate_link;
    name = name ? name : 'user';

    let body_plain;

    if (isForgotMail)
      body_plain = 'Dear ' + name + '\n' +
        'We receive password changing request from you.\n' + 'For changing your password please click on below link:\n' +
        '\n' + link + '\n\n' +
        'If you did not action to changing password, ignore this mail.\n\n\nBest regards\nIran-Insight Team';
    else
      body_plain = 'Dear ' + name + '\n' +
        'Thank you for registration.\n' + 'For complete your registration please click on below link:\n' +
        '\n' + link + '\n\n' +
        'If you did not action to registration, ignore this mail.\n\n\nBest regards\nIran-Insight Team';

    let body_html;

    if (isForgotMail)
      body_html = `<p>Dear ${name}</p>
                       <p>We receive password changing request from you.</p>
                       <p>For changing your password please click on below link:</p>
                       <a href="${link}">${link}</a>
                       <br/><br/>
                       <p>If you did not action to changing password, ignore this mail.</p>
                       <br/>
                       <br/>
                       <div style="font-size: 13px">
                         <p>Best regards</p>
                         <p>Iran-Insight Team</p>
                       </div>`;
    else
      body_html = `<p>Dear ${name}</p>
                       <p>Thank you for registration.</p>
                       <p>For complete your registration please click on below link:</p>
                       <a href="${link}">${link}</a>
                       <br/><br/>
                       <p>If you did not action to registration, ignore this mail.</p>
                       <br/>
                       <br/>
                       <div style="font-size: 13px">
                         <p>Best regards</p>
                         <p>Iran-Insight Team</p>
                       </div>`;

    return {
      plainContent: body_plain,
      htmlContent: body_html,
      subject: isForgotMail ? 'Changing Your Iran-Insight Account Password' : 'Iran-Insight Account Activation'
    };
  }

  static registration(body) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let pid = null;

      if (!body.email || body.email === '')
        reject(error.emptyEmail);
      else if (!body.display_name || body.display_name === '')
        reject(error.emptyName);
      else if (!Person.checkMailCorrectness(body.email))
        reject(error.emailIsIncorrect);
      else {
        curSql[tableName].get({username: body.email})
          .then(res => {
            if (res && res.length > 0)
              return Promise.reject(error.emailExist);
            else
              return curSql[tableName].add({
                username: body.email,
                display_name_en: Person.detectLanguage(body.display_name) === 'en' ? body.display_name : null,
                display_name_fa: Person.detectLanguage(body.display_name) === 'fa' ? body.display_name : null,
                is_user: false
              });
          })
          .then(res => {
            pid = parseInt(res.pid);
            return Person.sendActivationMail(body.email, false, pid, body.display_name);
          })
          .then(res => resolve(pid))
          .catch(err => {
            console.error(err);
            reject(err);
          })
      }
    })
  }

  static checkActiveLink(link) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      curSql[personActivationLinkTable].getByLink({link: link})
        .then(res => {
          if (res.length > 1)
            reject(error.duplicateLink);
          if (res.length === 1)
            resolve({username: res[0].username, pid: res[0].pid});
          else
            reject(error.expiredLink);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static emailIsExist(data) {
    if (!data.username)
      return Promise.reject(error.emptyUsername);

    const curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      curSql[tableName].get({username: data.username})
        .then(res => {
          if (res.length > 0)
            resolve(true);
          else
            resolve(false);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static select() {
    let curSql = Person.test ? sql.test : sql;
    return curSql.person.select();
  }

  static delete(id) {
    let curSql = Person.test ? sql.test : sql;
    return curSql.person.delete(id);
  }

  static socketHandler(message) {
    if (message.data.toLowerCase().includes('broadcast'))
      return Person.broadCastMessageToGroup(message.data);
    else {
      return Person.sendMessageToClient(message.data, 'user/' + message.rcv);
    }
  }

  static sendMessageToClient(data, client) {
    return socket.sendMessage(data, client);
  }

  static broadCastMessageToGroup(data) {
    return socket.sendNewMessageToAllClient(data);
  }

  static getPersonFullName(person) {
    let firstnamePart = (person.firstname_en || person.firstname_fa);
    let surnamePart = (person.surname_en || person.surname_fa);

    if (firstnamePart && surnamePart)
      return firstnamePart + ' ' + surnamePart;
    else if (firstnamePart && !surnamePart)
      return firstnamePart;
    else if (!firstnamePart && surnamePart)
      return surnamePart;
    else
      return ' ';
  }
}

Person.test = false;
module.exports = Person;
