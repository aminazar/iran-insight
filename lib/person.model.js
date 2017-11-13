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
const Expertise = require('./expertise.model');
const moment = require('moment');
const helper = require('./helpers');
const Notification = require('./notification.system');

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
  'display_name_fa'
];

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
          Person.setNamespace(username);
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
    return new Promise((resolve, reject) => {
      let pid = null;

      this.sql[personActivationLinkTable].getByLink({link: link})
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
          return this.sql[personActivationLinkTable].deleteByLink({link: link});
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
          // let mailPromiseList = [];
          // let mailContent = Person.composeRepRequest(person.display_name_en, );

          let msg = {
            from: person,
            about: Notification.getNotificationCategory().IntroducingRep,
            aboutData: {
              person_name: ((person.firstname_en) ? person.firstname_en : person.firstname_fa) + ' ' + ((person.surname_en) ? person.surname_en : person.surname_fa),
              orgBiz_name: isBiz ? biz_org_data.name : biz_org_data.org_name,
              person_username: person.username,
            }
          };

          // res.forEach(el => {
          //   mailPromiseList.push(helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, 'Applying Representative', el.username));
          // });

          // return Promise.all(mailPromiseList.map(e => e.catch(e)));
          //ToDo: call push notification method from notification system model
          resolve(mid);
        })
        // .then(res => resolve(mid))
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
            from: actor,
            about: Notification.getNotificationCategory().UserUpdateProfile,
            aboutData: {
              person_name: (actor.firstname_en ? actor.firstname_en : actor.firstname_fa) + ' ' + (actor.surname_en ? actor.surname_en : actor.surname_fa),
              person_username: actor.username,
            }
          };

          //ToDo: call push notification method from notification system model
          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  setExpertise(user, body) {
    return new Promise((resolve, reject) => {

      if (!body.pid)
        reject(error.noId);

      let expertise = body.expertise;


      this.getUserAccess(user.pid, body.pid).then(res => {

        if (res.isAdmin || res.isUser) { // user himself is insert/update his expertise or admin is doing that
          if (!body.pid) // pid must be declared in req body to determine which user is changing
            return Promise.reject(error.noId);


          if (!expertise.expertise_id) { // add new expertise

            return this.sql.expertise.add(expertise);
          }
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
            from: user,
            about: Notification.getNotificationCategory().UserAddExpertise,
            aboutData: {
              person_name: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
              expertise_name: body.expertise.name_en ? body.expertise.name_en : body.expertise.name_fa,
              person_username: user.username,
            }
          };

          //ToDo: call push notification method from notification system model
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  getExpertise(user_pid, param_pid) {
    return this.sql.person.getPersonExpertise({pid: param_pid});
  }

  deleteExpertise(user, body) {
    return new Promise((resolve, reject) => {
      console.log('user ', user);
      this.getUserAccess(user.pid, body.pid).then(res => {

        if (!res.isAdmin && !res.isUser)
          return Promise.reject(error.notAllowed);

        if (!body.expertise_id)
          return Promise.reject(error.noExpertiseId);

        return this.sql.person.deleteExpertiseById({expertise_id: body.expertise_id, pid: body.pid});

      }).then(res => {
        let msg = {
          from: user,
          about: Notification.getNotificationCategory().UserRemoveExpertise,
          aboutData: {
            person_name: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
            aboutData: body.expertise_id,
            person_username: user.username,
          }
        };

        //ToDo: call push notification method from notification system model
        resolve(res);
      }).catch(err => {
        reject(err);
      });


    });

  }

  setPartnership(user, body) {
    return new Promise((resolve, reject) => {
      this.getUserAccess(user.pid, body.pid1).then(res => {
        if (res.isAdmin || res.isUser) { // user himself is insert/update his expertise or admin is doing that
          if (!body.pid1) // pid must be declared in req body to determine which user is changing
            return Promise.reject(error.noId);

          if (!body.id) { // add new expertise

            if (!body.pid2)
              return Promise.reject(error.noId);

            body.is_confirmed = res.isAdmin;

            this.sql.partnership.add(body)
              .then(() => {
                if (!res.isAdmin)
                  this.sql.person.getUserById({pid: body.pid1}).then(person1 => { // send email to pid2 about partnership request by pid1
                    this.sql.person.getUserById({pid: body.pid2}).then(person2 => {
                      let msg = {
                        from: user,
                        about: Notification.getNotificationCategory().PersonRequestPartnership,
                        aboutData: {
                          person_name: (person1[0].firstname_en ? person1[0].firstname_en : person1[0].firstname_fa) + ' ' + (person1[0].surname_en ? person1[0].surname_en : person1[0].surname_fa),
                          partnership_description: (body.description ? body.description : body.description_fa),
                          person_username: person1[0].username,
                        }
                      };

                      //ToDo: call push notification method from notification system model
                      // helpers.sendMail(`partnership request is received by ${person1[0].username }`, null, 'partnership', person2[0].username).then(() => {
                      // });
                      resolve();
                    });
                  });
                else
                  resolve();

              })

          }
          else { // update expertise

            if (!res.isAdmin) {
              delete body.pid1; // pid 1 should not be changed during update of partnership
              delete body.pid2; // pid 2 should not be changed during update of partnership
              delete body.is_confirmed; // is_confirmed should not change during update of partnership
            }
            this.sql.partnership.update(body, body.id).then(res => {
              resolve();
            });
          }
        } else {
          reject(error.notAllowed);
        }
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  confirmPartnership(user, body) {
    return new Promise((resolve, reject) => {
      let updateId = null;
      let partnershipDetails = null;
      this.getUserAccess(user.pid, body.pid2)
        .then(res => {
          if (res.isAdmin || res.isUser) { // user himself or admin is confirming a partnership
            if (body.is_confirmed)
              this.sql.partnership.update({is_confirmed: body.is_confirmed}, body.id)
                .then(res => {
                  updateId = res;
                  return this.sql.partnership.get({id: body.id});
                })
                .then(res => {
                  let msg = {
                    from: user,
                    about: Notification.getNotificationCategory().PeopleAddPartnership,
                    aboutData: {
                      person_name1: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
                      person_name2: (res[0].firstname_en ? res[0].firstname_en : res[0].firstname_fa) + ' ' + (res[0].surname_en ? res[0].surname_en : res[0].surname_fa),
                      partnership_description: res[0].description ? res[0].description : res[0].description_fa,
                      person_username1: user.username,
                      person_username2: res[0].username,
                    }
                  };

                  //ToDo: call push notification method from notification system model
                  resolve(updateId)
                })
                .catch(err => reject(err));
            else
              this.sql.partnership.get({id: body.id})
                .then(res => {
                  partnershipDetails = res[0];
                  return this.sql.partnership.delete(body.id);
                })
                .then(res => {
                  let msg = {
                    from: user,
                    about: Notification.getNotificationCategory().PersonRejectPartnershipRequest,
                    aboutData: {
                      person_name: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
                      partnership_description: partnershipDetails.description ? partnershipDetails.description : partnershipDetails.description_fa,
                      person_username: user.username,
                    }
                  };

                  //ToDo: call push notification method from notification system model
                  resolve(res)
                })
                .catch(err => reject(err));
          } else {
            reject(error.notAllowed);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  deletePartnership(user, body) {
    return new Promise((resolve, reject) => {
      this.sql.partnership.get({id: body.id}).then(partnership => {
        this.getUserAccess(user.pid, partnership[0].pid1).then(res => {
          if (res.isAdmin || res.isUser) { // pid1 is deleting partnership
            if (!body.id)
              reject(error.noPartnershipId);

            this.sql.partnership.delete(body.id)
              .then(res => {
                let msg = {
                  from: user,
                  about: Notification.getNotificationCategory().PersonRemovePartnership,
                  aboutData: {
                    person_name: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
                    partnership_description: partnership[0].description ? partnership[0].description : partnership[0].description_fa,
                    person_username: user.username,
                  }
                };

                //ToDo: call push notification method from notification system model
                resolve(res);
              })
          } else {
            this.getUserAccess(user.pid, partnership[0].pid2).then(res => {
              if (res.isAdmin || res.isUser) { // pid2 is deleting partnership
                if (!body.id)
                  reject(error.noPartnershipId);

                this.sql.partnership.delete(body.id)
                  .then(() => {
                    let msg = {
                      from: user,
                      about: Notification.getNotificationCategory().PersonRemovePartnership,
                      aboutData: {
                        person_name: (user.firstname_en ? user.firstname_en : user.firstname_fa) + ' ' + (user.surname_en ? user.surname_en : user.surname_fa),
                        partnership_description: partnership[0].description ? partnership[0].description : partnership[0].description_fa,
                        person_username: user.username,
                      }
                    };

                    //ToDo: call push notification method from notification system model
                    resolve();
                  }).catch(err => reject(err));
              } else {
                reject(error.notAllowed);
              }
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  getPartnership(user_pid, param_pid) {
    return new Promise((resolve, reject) => {

      if (!param_pid)
        reject(error.noId);

      this.getUserAccess(user_pid, param_pid).then(res => {

        if (res.isAdmin || res.isUser) { // user him/her self or admin is not getting user partnership

          return this.sql.partnership.getById({pid: param_pid});
        } else {
          return this.sql.partnership.getConfirmedById({pid: param_pid});
        }
      })
        .then(res => resolve(res))
        .catch(err => {
          reject(err);
        });
    });
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

          if (body.notify_period !== 'n' && body.notify_period !== 'd' && body.notify_period !== 'w' && body.notify_period !== 'i') // incorrect notify_type
          // valid notify_types are => d: daily, w: weekly, n: never, i: instantly
            return Promise.reject(error.incorrectNotifyType);

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

    return new Promise((resolve, reject) => {

      this.sql.person.get({pid: user_pid}).then(res => {

        if (res.length === 0)
          reject(error.noUser);

        if (res[0].secret.substring(0, 5) !== hash)
          reject(error.notAllowed);


        this.sql.person.update({notify_period: 'n'}, user_pid).then(res => {
          resolve(res);
        }).catch(err => reject(err));

      });

    });
  }

  getUserAccess(user_pid, dest_pid) {

    return new Promise((resolve, reject) => {

      let access = {
        isUser: false,
        isAdmin: false
      };
      this.sql.person.getUserById({pid: user_pid}).then(res => {
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
  };

  static deserialize(person, done) {
    let personInstance = new Person();
    personInstance.username = person.username;
    personInstance.password = person.password;

    personInstance.loginCheck()
      .then(() => done(null, person))
      .catch(err => {
        console.log(err.message);
        done(err);
      });
  };

  static passportLocalStrategy(req, username, password, done) {
    let person = new Person(helpers.isTestReq(req));
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
    let person = new Person(helpers.isTestReq(req));

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

  static afterLogin(username) {
    return new Promise((resolve, reject) => {
      Person.setNamespace(username);
      resolve({username: username, userType: username === 'admin' ? 'admin' : 'user'});
    })
  }

  static setNamespace(username) {
    socket.storeNamespace((username === 'admin' ? 'admin' : 'user') + '/' + username);
  }

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

  static sendActivationMail(email, person_id, display_name) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let displayName = display_name;
      let pid = null;
      let personData = null;
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
          if (res) {
            personData = res[0];
            displayName = (res[0].display_name_en) ? res[0].display_name_en : res[0].display_name_fa;
            pid = parseInt(res[0].pid);
          }
          return Person.generateActivationLink(pid);
        })
        .then(res => {
          let msg = {
            from: personData,
            about: Notification.getNotificationCategory().Registration,
            aboutData: {
              displayName: displayName,
              activationLink: res
            },
          };

          // let mailContent = Person.composeActivationMail(displayName, res);
          // return helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, 'Activation Iran-Insight Account', email);

          //ToDo: Call push notification method from notification system model
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
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
            return Person.sendActivationMail(body.email, pid, body.display_name);
          })
          .then(res => resolve(pid))
          .catch(err => {
            console.log(err);
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
            resolve(res[0].pid);
          else
            reject(error.expiredLink);
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

  static findRepRequests() {
    let curSql = Person.test ? sql.test : sql;
    let repInfo = [];
    return new Promise((resolve, reject) => {
      curSql[tableName].getListOfRepresentationRequests()
        .then(res => {
          if (res.length === 0)
            resolve('No new representative request.');
          else if (res.length > 0) {
            res.forEach(el => {
              let tempObj = repInfo.find(i => i.person.pid === el.pid);
              if (tempObj) {
                if (el.bid)
                  tempObj.business.push({
                    bizname: el.biz_name,
                    bizname_fa: el.biz_name_fa,
                    bizceo_pid: el.biz_ceo_pid,
                    biz_type_id: el.biz_type_id,
                    bizaddress: el.biz_address,
                    bizaddress_fa: el.biz_address_fa,
                    biztel: el.biz_tel,
                    bizurl: el.biz_url,
                    bizgeneral_stats: el.biz_general_stats,
                    bizfinancial_stats: el.biz_financial_stats,
                    biz_position: el.pos_id ? el.position_name_fa : null
                  });

                if (el.oid)
                  tempObj.organization.push({
                    orgname: el.org_name,
                    orgname_fa: el.org_name_fa,
                    orgceo_pid: el.org_ceo_pid,
                    org_type_id: el.org_type_id,
                    org_position: el.pos_id ? el.position_name_fa : null
                  });
              }
              else {
                repInfo.push({
                  person: {
                    pid: el.pid,
                    firstname_en: el.first_name_en,
                    firstname_fa: el.first_name_fa,
                    surname_en: el.surname_en,
                    surname_fa: el.surname_fa,
                    username: el.username,
                    display_name_en: el.display_name_en,
                    display_name_fa: el.display_name_fa
                  },
                  business: el.bid ? [{
                    bizname: el.biz_name,
                    bizname_fa: el.biz_name_fa,
                    bizceo_pid: el.biz_ceo_pid,
                    biz_type_id: el.biz_type_id,
                    bizaddress: el.biz_address,
                    bizaddress_fa: el.biz_address_fa,
                    biztel: el.biz_tel,
                    bizurl: el.biz_url,
                    bizgeneral_stats: el.biz_general_stats,
                    bizfinancial_stats: el.biz_financial_stats,
                    biz_position: el.pos_id ? el.position_name_fa : null
                  }] : [],
                  organization: el.oid ? [{
                    orgname: el.org_name,
                    orgname_fa: el.org_name_fa,
                    orgceo_pid: el.org_ceo_pid,
                    org_type_id: el.org_type_id,
                    org_position: el.pos_id ? el.position_name_fa : null
                  }] : []
                });
              }
            });
            console.log(JSON.stringify(repInfo, null, 2));
            resolve(repInfo);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static confirmRepByAdmin(mid, aid, user) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      curSql.membership.checkIfRepIsExist({aid: aid})
        .then((res) => {
          if (res.length === 1) {
            return curSql.membership.update({is_active: true}, mid);
          }
          else if (res.length > 1) {
            return Promise.all(res.map(el => {
              if (el.mid === parseInt(mid)) {
                return curSql.membership.update({is_active: true}, mid);
              }
              else if (el.mid !== parseInt(mid)) {
                return curSql.membership.update({is_representative: false}, el.mid);
              }
            }))
          }
          else if (res.length === 0) {
            reject(error.hasRepresentative);
          }
        })
        .then(() => {
          curSql.membership.getBizOrgNameById({mid: mid})
            .then(res => {
              let msg = {
                from: user,
                about: Notification.getNotificationCategory().UpdateBusinessOrganizationRep,
                aboutData: {
                  person_name: (user.firstname_en || user.firstname_fa) + ' ' + (user.surname_en || user.surname_fa),
                  person_username: user.username,
                  org_biz_name: res[0].name || res[0].name_fa,
                  is_business: res[0].is_biz,
                }
              };

              //ToDo: call notification method
            });

          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        })
    })
  };

  static deleteRepRequest(mid) {
    let curSql = Person.test ? sql.test : sql;
    return new Promise((resolve, reject) => {
      curSql.membership.get({mid: mid})
        .then(res => {
          if (res[0].is_representative === false)
            reject(error.hasRepresentative);
          else {
            return curSql.membership.update({is_representative: false, is_active: true}, mid)
              .then(() => {
                resolve();
              })
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static deleteRepAndHisCompany(mid) {
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let assocMemberObj = {};
      curSql.membership.getWithAssoc({mid: mid})
        .then(res => {
          if (res[0].is_representative === false)
            reject(error.hasRepresentative);
          else {
            assocMemberObj = res[0];
            return curSql.membership.delete(assocMemberObj.mid);
          }
        })
        .then(() => {
          return curSql.association.delete(assocMemberObj.assoc_id)
            .catch(err => resolve())
        })
        .then(() => {
          if (assocMemberObj.bid) {
            return curSql.business.delete(assocMemberObj.bid)
              .catch(err => resolve())
          }
          else {
            return curSql.organization.delete(assocMemberObj.oid)
              .catch(err => resolve())
          }
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        })
    });
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
}

Person.test = false;
module.exports = Person;
