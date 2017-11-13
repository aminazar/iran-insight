let cron = require('node-cron');
let {mailPeriodConfig} = require('../env');
const sql = require('../sql');
const helpers = require('./helpers');
const rx = require('rxjs');
const redis = require('../redis');

let notificationCategory = {
  Registration: 'registration',
  IntroducingRep: 'introducing-rep',
  RejectRepRequest: 'reject-rep-request',
  AcceptRepRequest: 'accept-rep-request',
  UserUpdateProfile: 'user-update-profile',
  BusinessUpdateProfile: 'business-update-profile',
  OrganizationUpdateProfile: 'organization-update-profile',
  UserAddExpertise: 'user-add-expertise',
  UserUpdateExpertise: 'user-update-expertise',
  UserRemoveExpertise: 'user-remove-expertise',
  PeopleAddPartnership: 'people-add-partnership',
  PersonRequestPartnership: 'person-request-partnership',
  PersonRejectPartnershipRequest: 'person-reject-partnership-request',
  PersonRemovePartnership: 'person-remove-partnership',
  PersonConfirmPartnership: 'person-confirm-partnership',
  BusinessAddProduct: 'business-add-product',
  BusinessUpdateProduct: 'business-update-product',
  BusinessRemoveProduct: 'business-remove-product',
  BusinessAddLifeCycleEvent: 'business-add-life-cycle-event',
  BusinessRequestLifeCycleEvent: 'business-request-life-cycle-event',
  BusinessRemoveLifeCycleEvent: 'business-remove-life-cycle-event',
  BusinessConfirmLifeCycleEvent: 'person-confirm-life-cycle-event',
  BusinessRejectLifeCycleEvent: 'business-reject-life-cycle-event',
  TwoBusinessAddLifeCycleEvent: 'two-business-add-life-cycle-event',
  OrganizationAddLifeCycleEvent: 'organization-add-life-cycle-event',
  OrganizationRequestLifeCycleEvent: 'organization-request-life-cycle-event',
  OrganizationRemoveLifeCycleEvent: 'organization-remove-life-cycle-event',
  OrganizationConfirmLifeCycleEvent: 'organization-confirm-life-cycle-event',
  OrganizationRejectLifeCycleEvent: 'organization-reject-life-cycle-event',
  TwoOrganizationAddLifeCycleEvent: 'two-organization-add-life-cycle-event',
  UpdateBusinessOrganizationRep: 'update-business-organization-rep',
  OrganizerAddUpdateEvent: 'organizer-add-update-event',
  OrganizerRemoveEvent: 'person-remove-event',
  XAttendsToEvent: 'x-attend-to-event',
  XDisregardForEvent: 'x-disregard-for-event',
  PersonJoinTo: 'person-join-to',
  PersonRejectJoinRequest: 'person-reject-join-request',
  PersonInvestsOnBusiness: 'person-invest-business',
  OrganizationInvestsOnBusiness: 'organization-invest-business',
  PersonClaimInvestmentOnBusiness: 'person-claim-investment-business',
  OrganizationClaimInvestmentOnBusiness: 'organization-claim-investment-business',
  AcceptInvestment: 'accept-investment',
  RemoveInvestmentOnBusiness: 'remove-investment-business',
  RejectInvestmentOnBusiness: 'reject-investment-business',
  PersonConsultingBusiness: 'person-consulting-business',
  OrganizationConsultingOnBusiness: 'organization-consulting-business',
  PersonClaimConsultingBusiness: 'person-claim-consulting-business',
  OrganizationClaimConsultingBusiness: 'organization-claim-consulting-business',
  AcceptConsulting: 'accept-consulting',
  RemoveConsultancyOnBusiness: 'remove-consultancy-business',
  RejectConsultancyOnBusiness: 'reject-consultancy-business',
};

let notificationType = {
  Daily: 'd',
  Weekly: 'w',
  Never: 'n',
  Instantly: 'i',
};

let baseLink = 'https://iran-insight.com';


class NotificationSystem {
  constructor(test = NotificationSystem.test) {
    NotificationSystem.test = test;
    this.test = test;
    this.sql = test ? sql.test : sql;
    this.pattern = test ? 'tmsg:' : 'msg:';

    this.obs = {};
    this.counter = {};

    this.dailyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * *`, () => {
      this.sendMailToRecipient('d');
    });

    this.weeklyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * ${mailPeriodConfig.dayOfWeek}`, () => {
      this.sendMailToRecipient('w');
    });

    redis.redisClientInit()
      .then(() => redis.redis_sub().psubscribe(`${this.pattern}*`))
      .then(() => {
        this.isReady = true;
      })
  }

  sendMailToRecipient(type) {
    if (type !== 'w' && type !== 'd')
      return;

    this.sql.person.get({notify_period: type}).then(res => {

      if (res.length > 0) {

        res.forEach(person => {
          NotificationSystem.fetChNotifications(person.pid).forEach(note => {
            helpers.sendMail(note, null, 'notification', person.username).catch(err => console.log('-> ', 'failed to send email notification'));
          });
        });
      }
    });
  }

  fetchNotifications(pid) {
    return new Promise((resolve, reject) => {
      redis.redis_client().keysAsync(`${this.pattern}${pid}:*`)
        .then(keys => {
          return Promise.all(keys.map(k => redis.get(k)))
        })
        .then(ret => {
          ret.sort((x, y) => y.order - x.order);
          resolve(ret);
        })
        .catch(reject)
    });
  };

  getObservable(pid) {
    if (!this.obs[pid]) {
      this.obs[pid] = new rx.Observable(subscriber => {
        redis.redis_sub().on('pmessage', (pattern, channel, message) => {
          try {
            if (+channel.split(':')[1] === pid)
              subscriber.next(JSON.parse(message));
          } catch (e) {
            subscriber.error(e);
          }
        })
      }).publish();

      this.obs[pid].connect();
    }

    return this.obs[pid];
  }

  static getNotificationCategory() {
    return notificationCategory;
  }

  deleteNotification(pid, order) {
    if (order !== undefined) {
      return redis.redis_client().delAsync(`${this.pattern}${pid}:${order}`);
    } else {
      return redis.redis_client().keysAsync(`${this.pattern}${pid}:*`)
        .then(keys => {
          return Promise.all(keys.map(k => redis.redis_client().delAsync(k)));
        });
    }
  }

  deleteChannel(pid) {
    if (this.obs[pid]) {
      delete this.obs[pid];
    }
  }

  findRecipients(from, actionableBy) {
    return new Promise((resolve, reject) => {
      if (actionableBy) {
        let {pid, oid, bid} = actionableBy;
        if (pid) {
          resolve([pid])
        } else if (oid) {
          this.sql.membership.getOrgRep({oid})
            .then(res => {
              if (!res.length) {
                return this.sql.administrators.select()
              } else {
                return Promise.resolve(res)
              }
            })
            .then(res => {
              resolve(res.map(r => r.pid));
            })
            .catch(reject)
        } else if (bid) {
          this.sql.membership.getBizRep({bid})
            .then(res => {
              if (!res.length) {
                return this.sql.administrators.select()
              } else {
                return Promise.resolve(res)
              }
            })
            .then(res => {
              resolve(res.map(r => r.pid));
            })
            .catch(reject)
        }
      } else {
        let {pid, oid, bid} = from;
        if (pid) {
          this.sql.subscription.getPersonSubscribers({pid})
            .then(res => resolve(res.map(r => r.pid)))
            .catch(reject)
        } else if (oid) {
          this.sql.subscription.getOrgSubscribers({oid})
            .then(res => resolve(res.map(r => r.pid)))
            .catch(reject)
        } else if (bid) {
          this.sql.subscription.getBizSubscribers({bid})
            .then(res => resolve(res.map(r => r.pid)))
            .catch(reject)
        }
      }
    })
  }

  pushNotification(note, actionableBy) {
    return new Promise((resolve, reject) => {
      this.findRecipients(note.from, actionableBy)
        .then(recipients => {
          resolve(Promise.all(recipients.map(pid => {
            note.timestamp = new Date();
            if (actionableBy) {
              note.isActionable = true;
            }
            if (!this.counter[pid])
              this.counter[pid] = 1;
            note.order = this.counter[pid];
            return redis.redis_client().setAsync(`${this.pattern}${pid}:${this.counter[pid]++}`, JSON.stringify(note))
              .then(() => {
                if (this.obs[pid]) {
                  return redis.redis_client().publishAsync(`${this.pattern}${pid}`, JSON.stringify(note));
                } else {
                  return Promise.resolve();
                }
              })
          })));
        })
        .catch(reject);
    });

  }

  // buildingMessage(messageType, data, user_id, user_subscription_hash) {
  //   // //Should check data.about (if only Registration, have to call composeActivationMail, otherwise continue logic
  //   // if(data.about === notificationCategory.Registration)
  //   //   return NotificationSystem.composeActivationMail(data.aboutData.name, data.aboutData.activationLink);
  //
  //   let message = {
  //     email: this.composeMail(messageType, data, user_id, user_subscription_hash),
  //     notification: this.composeNotification(messageType, data, user_id),
  //   };
  // };

  start() {
    this.dailyTask.start();
    this.weeklyTask.start();

    console.log('Notification system scheduler is running ');
  }

  composeNotification(messageType, data, user_id) {

  }

  composeMail(messageType, data, user_id, user_subscription_hash) {
    let message = {
      subject: null,
      body_plain: '',
      body_html: '',
    };

    //Set subject part
    if (messageType === notificationType.Never)
      return null;

    switch (messageType) {
      case notificationType.Daily:
        message.subject = 'The daily report of Iran-Insight';
        break;
      case notificationType.Weekly:
        message.subject = 'The weekly report of Iran-Insight';
        break;
      case notificationType.Instantly:
        message.subject = 'Notification from Iran-Insight';
        break;
      default:
        message.subject = 'Notification from Iran-Insight';
        break;
    }

    //Set body part
    if (!data)
      return null;

    if (data.length === 1) {
      let item = data[0];
      let link = baseLink + '/';

      if (item.mid)
        link += 'message/' + item.mid;
      else if (item.pid)
        link += 'people/' + item.pid;
      else if (item.bid)
        link += 'business/' + item.bid;
      else if (item.oid)
        link += 'organization/' + item.oid;
      else {
        return null;
      }

      message.body_plain += 'You have new message from ' + item.name +
        '\n\t' + item.message +
        '\nTo see this message click on ' + link;
      message.body_html += `<div>
                                <div>You have new message from ${item.name}</div>
                                <div style="margin-left: 10px">${item.message}</div>
                                <div>To see this message click <a href="${link}">here</a></div>
                              </div>`;
    }
    else {
      let actionRequiredObjects = data.filter(el => el.is_actionable === true);
      let personObjects = data.filter(el => el.from.pid && el.is_actionable === false);
      let businessObjects = data.filter(el => el.from.bid && el.is_actionable === false);
      let organizationObjects = data.filter(el => el.from.oid && el.is_actionable === false);

      //Generate Action Required Message
      let actionRequiredMessages_plain = (actionRequiredObjects.length) ? 'Your Messages\n' : null;
      let actionRequiredMessages_html = (actionRequiredObjects.length) ? `<div style="font-weight: bold">Your Messages</div>` : null;

      if (actionRequiredMessages_html) {
        let middleContent = '';
        actionRequiredObjects.forEach(el => {
          middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/messages/${el.mid}" target="_blank">See Message</a></td>
                            </tr>`
        });
        actionRequiredMessages_html += `<div style="margin-left: 10px">
                                          <tabel>
                                            <thead>
                                              <td>Name</td>
                                              <td>Event</td>
                                              <td>Link</td>
                                            </thead>
                                            <tbody>` +
          middleContent +
          `</tbody>
                                          </tabel>
                                         </div>`;
      }

      actionRequiredObjects.forEach(el => {
        actionRequiredMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick link to see message: ' + baseLink + '/messages/' + el.mid;
      });


      //Generate Person Messages
      let personMessages_plain = (personObjects.length) ? 'People\n' : null;
      let personMessages_html = (personObjects.length) ? `<div style="font-weight: bold">People</div>` : null;

      if (personMessages_html) {
        let middleContent = '';
        personObjects.forEach(el => {
          middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/people/${el.pid}">See Message</a></td>
                            </tr>`;
        });
        personMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      personObjects.forEach(el => {
        personMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/people/' + el.pid;
      });

      //Generate Business Messages
      let businessMessages_plain = (businessObjects.length) ? 'Business\n' : null;
      let businessMessages_html = (businessObjects.length) ? `<div style="font-weight: bold">Business</div>` : null;

      if (businessMessages_html) {
        let middleContent = '';
        businessObjects.forEach(el => {
          middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/business/${el.bid}">See Message</a></td>
                            </tr>`;
        });
        businessMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      businessObjects.forEach(el => {
        businessMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/business/' + el.bid;
      });

      //Generate Organization Messages
      let organizationMessages_plain = (organizationObjects.length) ? 'Organization\n' : null;
      let organizationMessages_html = (organizationObjects.length) ? `<div style="font-weight: bold">Organization</div>` : null;

      if (organizationMessages_html) {
        let middleContent = '';
        organizationObjects.forEach(el => {
          middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/organization/${el.oid}">See Message</a></td>
                            </tr>`;
        });
        organizationMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      organizationObjects.forEach(el => {
        organizationMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/organization/' + el.oid;
      });

      //Merge all parts to one html-content and plain-content
      if (actionRequiredObjects.length) {
        message.body_plain += actionRequiredMessages_plain;
        message.body_html += actionRequiredMessages_html;
      }

      //Check to set separator
      if (businessObjects.length || organizationObjects.length || personObjects.length) {
        message.body_plain += '\n*****\nYour Notifications\n\n';
        message.body_html += `<br/><div style="text-align: center;"><p>*****</p><p>Your Notifications</p></div><br/>`;
      }

      if (businessObjects.length) {
        message.body_plain += businessMessages_plain;
        message.body_html += businessMessages_html;
      }

      if (organizationObjects.length) {
        message.body_plain += organizationMessages_plain;
        message.body_html += organizationMessages_html;
      }

      if (personObjects.length) {
        message.body_plain += personMessages_plain;
        message.body_html += personMessages_html;
      }
    }

    //Append unsubscription link end of the message
    message.body_plain += "\n\nYou received this email because subscribe to Iran-Insight's notifications and messages" +
      "\nIf you want to unsubscribe from Iran-Insight's notifications and messages via email, please click on below link: " +
      "\n" + baseLink + '/user/unsubscribe/' + user_id + '/' + user_subscription_hash;
    message.body_html += `<div>
                            <p>You received this email because subscribe to Iran-Insight's notifications and messages</p>
                            <p>If you want to unsubscribe from Iran-Insight's notifications and messages via email, please click on below link: </p>
                            <p><a href="${baseLink}/user/unsubscribe/${user_id}/${user_subscription_hash}">${baseLink}/user/unsubscribe/${user_id}/${user_subscription_hash}</a></p>
                          </div>`;

    //Append signature
    message.body_plain += "\n\nBest regards\nIran-Insight Team";
    message.body_html += `<div><p>Best regards</p><p>Iran-Insight Team</p></div>`;

    return message;
  }

  //ToDo: Complete the function's logic
  static composeMessage(category, data) {
    switch (category) {
      case notificationCategory.IntroducingRep:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' asked you to be representative of ' + data.orgBiz_name,
          link: '',
        };
        break;
      case notificationCategory.UserUpdateProfile:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' was update his/her profile data',
          link: '',
        };
        break;
      case notificationCategory.AcceptRepRequest:
        return {
          msg: (data.person_name || data.person_username) + ' accepts your being representative request',
          link: '',
        };
        break;
      case notificationCategory.RejectRepRequest:
        return {
          msg: (data.person_name || data.person_username) + ' rejects your being representative request',
          link: '',
        };
        break;
      case notificationCategory.BusinessUpdateProfile:
        return {
          msg: 'Profile of ' + data.business_name + ' business was updated',
          link: '',
        };
        break;
      case notificationCategory.OrganizationUpdateProfile:
        return {
          msg: 'Profile of ' + data.organization_name + ' organization was updated',
          link: '',
        };
        break;
      case notificationCategory.UserAddExpertise:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' added new expertise "' + data.expertise_name + '"',
          link: '',
        };
        break;
      case notificationCategory.UserUpdateExpertise:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' updated his/her expertise "' + data.expertise_name + '"',
          link: '',
        };
        break;
      case notificationCategory.UserRemoveExpertise:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' deleted one expertise from his/her expertise list',
          link: '',
        };
        break;
      case notificationCategory.PeopleAddPartnership:
        return {
          msg: (data.person_name1 !== ' ' ? data.person_name1 : data.person_username) + ' and ' + (data.person_name2 !== ' ' ? data.person_name2 : data.person_username) + ' have new partnership relation: "' + data.partnership_description + '"',
          link: '',
        };
        break;
      case notificationCategory.PersonConfirmPartnership:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' accepted your partnership request',
          link: '',
        };
        break;
      case notificationCategory.PersonRequestPartnership:
        return {
          msg: 'Partnership request is received by ' + (data.person_name !== ' ' ? data.person_name : data.person_username) + '. ' + (data.partnership_description ? 'Description is ' + data.partnership_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.PersonRejectPartnershipRequest:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' rejected your partnership request.' + (data.partnership_description ? ' Description is ' + data.partnership_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.PersonRemovePartnership:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' remove a partnership.' + (data.partnership_description ? "Partnership's description is " + data.partnership_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.BusinessAddProduct:
        return {
          msg: data.business_name + ' business has new "' + data.product_name + '" product',
          link: '',
        };
        break;
      case notificationCategory.BusinessUpdateProduct:
        return {
          msg: data.business_name + ' business has updated its "' + data.product_name + '" product',
          link: '',
        };
        break;
      case notificationCategory.BusinessRemoveProduct:
        return {
          msg: 'Business ' + data.business_name + ' remove its product "' + data.product_name + '"',
          link: '',
        };
        break;
      case notificationCategory.BusinessAddLifeCycleEvent:
        return {
          msg: data.business_name + ' business added new life-cycle-event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.BusinessRequestLifeCycleEvent:
        return {
          msg: 'Life-Cycle-Event request is received by ' + data.business_name + ' business. ' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.BusinessRemoveLifeCycleEvent:
        return {
          msg: ((data.isAdmin) ? data.admin_name !== ' ' ? data.admin_name : data.admin_username : data.business_name + ' business') + ' remove the life cycle event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.BusinessConfirmLifeCycleEvent:
        return {
          msg: data.business_name + ' business has confirmed your requested life cycle event',
          link: '',
        };
        break;
      case notificationCategory.BusinessRejectLifeCycleEvent:
        return {
          msg: data.business_name + ' business rejected your life-cycle-event request.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.TwoBusinessAddLifeCycleEvent:
        return {
          msg: data.business_name1 + ' and ' + data.business_name2 + ' have new life cycle event.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.OrganizationAddLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization added new life-cycle-event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.OrganizationRequestLifeCycleEvent:
        return {
          msg: 'Life-Cycle-Event request is received by ' + data.organization_name + ' organization. ' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: ''
        };
        break;
      case notificationCategory.OrganizationRemoveLifeCycleEvent:
        return {
          msg: ((data.isAdmin) ? data.admin_name !== ' ' ? data.admin_name : data.admin_username : data.organization_name + ' organization') + ' remove the life cycle event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.OrganizationConfirmLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization has confirmed your requested life cycle event',
          link: '',
        };
        break;
      case notificationCategory.OrganizationRejectLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization rejected your life-cycle-event request.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.TwoOrganizationAddLifeCycleEvent: {
        return {
          msg: data.organization_name1 + ' and ' + data.organization_name2 + ' have new life cycle event.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: '',
        };
        break;
      }
      case notificationCategory.UpdateBusinessOrganizationRep:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' accepted your request for being representative of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization'),
          link: '',
        };
        break;
      case notificationCategory.OrganizerAddUpdateEvent:
        return {
          msg: (data.organizer_name !== ' ' ? data.organizer_name : data.organizer_username) + (data.is_updated ? ' updated' : ' added new') + " event. Event's title is " + data.event_description,
          link: '',
        };
        break;
      case notificationCategory.OrganizerRemoveEvent:
        return {
          msg: (data.organizer_name !== ' ' ? data.organizer_name : data.organizer_username) + ' removed event "' + data.event_description + '"',
          link: '',
        };
        break;
      case notificationCategory.XAttendsToEvent:
        return {
          msg: (data.is_person ? (data.person_name !== ' ' ? data.person_name : data.person_username) : (data.org_biz_name + (data.is_business ? ' business' : ' organization'))) + ' attends to "' + data.event_title + '" event',
          link: '',
        };
        break;
      case notificationCategory.XDisregardForEvent:
        return {
          msg: (data.is_person ? (data.person_name !== ' ' ? data.person_name : data.person_username) : (data.org_biz_name + (data.is_business ? ' business' : ' organization'))) + ' disregard for "' + data.event_title + '" event',
          link: '',
        };
        break;
      case notificationCategory.PersonJoinTo:
        return {
          msg: 'You are the member of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization') + ' now',
          link: '',
        };
        break;
      case notificationCategory.PersonRejectJoinRequest:
        return {
          msg: 'Your request to being member of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization') + ' is rejected',
          link: '',
        };
        break;
      case notificationCategory.PersonInvestsOnBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.OrganizationInvestsOnBusiness:
        return {
          msg: data.organization_name + ' organization invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.PersonClaimInvestmentOnBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' claims that invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.OrganizationClaimInvestmentOnBusiness:
        return {
          msg: data.organization_name + ' organization claims that invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.AcceptInvestment:
        return {
          msg: 'Your claim (investing on ' + data.business_name + ' business) is approved',
          link: '',
        };
        break;
      case notificationCategory.RemoveInvestmentOnBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' removes investing claim on ' + data.business_name,
          link: '',
        };
        break;
      case notificationCategory.RejectInvestmentOnBusiness:
        return {
          msg: 'Your claim (investing on ' + data.business_name + ' business) is rejected',
          link: '',
        };
        break;
      case notificationCategory.PersonConsultingBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.OrganizationConsultingOnBusiness:
        return {
          msg: data.organization_name + ' organization advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.PersonClaimConsultingBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' claims that advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.OrganizationClaimConsultingBusiness:
        return {
          msg: data.organization_name + ' organization claims that advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: '',
        };
        break;
      case notificationCategory.AcceptConsulting:
        return {
          msg: 'Your claim (advising to ' + data.business_name + ' business) is approved',
          link: '',
        };
        break;
      case notificationCategory.RemoveConsultancyOnBusiness:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' removes advising claim on ' + data.business_name,
          link: '',
        };
        break;
      case notificationCategory.RejectConsultancyOnBusiness:
        return {
          msg: 'Your claim (advising to ' + data.business_name + ' business) is rejected',
          link: '',
        };
        break;
      default:
        return null;
        break;
    }
  }

  static composeActivationMail(name, activate_link) {
    let link = baseLink + '/activate/' + activate_link;

    let body_plain = 'Dear ' + name + '\n' +
      'Thank you for registration.\n' + 'For complete your registration please click on below link:\n' +
      '\n' + link + '\n\n' +
      'If you did not action to registration, ignore this mail.\n';

    let body_html = `<p>Dear ${name}</p>
                       <p>Thank you for registration.</p>
                       <p>For complete your registration please click on below link:</p>
                       <a href="${link}">${link}</a>
                       <br/><br/>
                       <p>If you did not action to registration, ignore this mail.</p>`;

    return {
      body_plain: body_plain,
      body_html: body_html,
      subject: "Iran-Insight Account Activation's mail"
    };
  }
}

NotificationSystem.Test = false;
let notificationSystem; // Singleton
let setup = (isTest = false) => {
  return new Promise((resolve, reject) => {
    let c = 0;
    notificationSystem = new NotificationSystem(isTest);
    let notificationWaiter = setInterval(() => {
      if (notificationSystem.isReady) {
        clearInterval(notificationWaiter);
        resolve();
      } else if (c++ > 10) {
        reject('Failed after 10 attempts to initialize notification system');
      }
    }, 500);
  });
};
module.exports = {
  setup,
  get: () => notificationSystem,
};