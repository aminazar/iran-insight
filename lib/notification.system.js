let cron = require('node-cron');
let {mailPeriodConfig} = require('../env');
const sql = require('../sql');
const helpers = require('./helpers');
const rx = require('rxjs');
const redis = require('../redis');
const moment = require('moment');

let notificationCategory = {
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

  getNotificationCategory() {
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

  start() {
    this.dailyTask.start();
    this.weeklyTask.start();

    console.log('Notification system scheduler is running ');
  }

  composeNotification(data) {
    let result = [];

    data.forEach(el => {
      result.push(this.composeMessage(el.about, el.aboutData));
    });

    return result;
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

      let messageContentObject = this.composeMessage(item.about, item.aboutData);

      message.body_plain += 'You have new message from ' + moment(item.timestamp).format('YYYY-MMM-DD') + ':\n' +
        '\n\t' + messageContentObject.msg +
        '\nTo see this message click on ' + messageContentObject.link;
      message.body_html += `<div>
                                <div>You have new message from ${moment(item.timestamp).format('YYYY-MMM-DD')}:</div>
                                <div style="margin-left: 10px">${messageContentObject.msg}</div>
                                <div>To see this message click <a href="${messageContentObject.link}">here</a></div>
                              </div>`;
    }
    else {
      let actionRequiredObjects = data.filter(el => el.isActionable === true);
      let personObjects = data.filter(el => el.from.pid && el.isActionable === false);
      let businessObjects = data.filter(el => el.from.bid && el.isActionable === false);
      let organizationObjects = data.filter(el => el.from.oid && el.isActionable === false);

      //Generate Action Required Message
      let actionRequiredMessages_plain = (actionRequiredObjects.length) ? 'Your Messages\n' : null;
      let actionRequiredMessages_html = (actionRequiredObjects.length) ? `<div style="font-weight: bold">Your Messages</div>` : null;

      if (actionRequiredMessages_html) {
        let middleContent = '';
        actionRequiredObjects.forEach(el => {
          let messageContentObject = this.composeMessage(el.about, el.aboutData);

          middleContent += `<tr>
                              <td>${messageContentObject.msg}</td>
                              <td><a href="${messageContentObject.link}" target="_blank">See Message</a></td>
                              <td>${moment(el.timestamp).format('YYYY-MMM-DD')}</td>
                            </tr>`
        });
        actionRequiredMessages_html += `<div style="margin-left: 10px">
                                          <tabel>
                                            <thead>
                                              <td>Message</td>
                                              <td>Link</td>
                                              <td>Date</td>
                                            </thead>
                                            <tbody>` +
          middleContent +
          `</tbody>
                                          </tabel>
                                         </div>`;
      }

      actionRequiredObjects.forEach(el => {
        let messageContentObject = this.composeMessage(el.about, el.aboutData);

        actionRequiredMessages_plain += '\t"' + messageContentObject.msg + '" received at ' + moment(el.timestamp).format('YYYY-MMM-DD') + '\nClick link to see message: ' + messageContentObject.link + '\n';
      });


      //Generate Person Messages
      let personMessages_plain = (personObjects.length) ? 'People\n' : null;
      let personMessages_html = (personObjects.length) ? `<div style="font-weight: bold">People</div>` : null;

      if (personMessages_html) {
        let middleContent = '';
        personObjects.forEach(el => {
          let messageContentObject = this.composeMessage(el.about, el.aboutData);

          middleContent += `<tr>
                              <td>${messageContentObject.msg}</td>
                              <td><a href="${messageContentObject.link}">See Message</a></td>
                              <td>${moment(el.timestamp).format('YYYY-MMM-DD')}</td>
                            </tr>`;
        });
        personMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Notification</td>
                                      <td>Link</td>
                                      <td>Date</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      personObjects.forEach(el => {
        let messageContentObject = this.composeMessage(el.about, el.aboutData);

        personMessages_plain += '\t"' + messageContentObject.msg + '" received at '+ moment(el.timestamp).format('YYYY-MMM-DD') + '\nClick to see message: ' + messageContentObject.link + '\n';
      });

      //Generate Business Messages
      let businessMessages_plain = (businessObjects.length) ? 'Business\n' : null;
      let businessMessages_html = (businessObjects.length) ? `<div style="font-weight: bold">Business</div>` : null;

      if (businessMessages_html) {
        let middleContent = '';
        businessObjects.forEach(el => {
          let messageContentObject = this.composeMessage(el.about, el.aboutData);

          middleContent += `<tr>
                              <td>${messageContentObject.msg}</td>
                              <td><a href="${messageContentObject.link}">See Message</a></td>
                              <td>${moment(el.timestamp).format('YYYY-MMM-DD')}</td>
                            </tr>`;
        });
        businessMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Notification</td>
                                      <td>Link</td>
                                      <td>Date</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      businessObjects.forEach(el => {
        let messageContentObject = this.composeMessage(el.about, el.aboutData);

        businessMessages_plain += '\t"' + messageContentObject.msg + '" received at ' + moment(el.timestamp).format('YYYY-MMM-DD') + '\nClick to see message: ' + messageContentObject.link + '\n';
      });

      //Generate Organization Messages
      let organizationMessages_plain = (organizationObjects.length) ? 'Organization\n' : null;
      let organizationMessages_html = (organizationObjects.length) ? `<div style="font-weight: bold">Organization</div>` : null;

      if (organizationMessages_html) {
        let middleContent = '';
        organizationObjects.forEach(el => {
          let messageContentObject = this.composeMessage(el.about, el.aboutData);

          middleContent += `<tr>
                              <td>${messageContentObject.msg}</td>
                              <td><a href="${messageContentObject.link}">See Message</a></td>
                              <td>${moment(el.timestamp).format('YYYY-MMM-DD')}</td>
                            </tr>`;
        });
        organizationMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Notification</td>
                                      <td>Link</td>
                                      <td>Date</td>
                                    </thead><tbody>` +
          middleContent +
          `</tbody></tabel>
         </div>`;
      }

      organizationObjects.forEach(el => {
        let messageContentObject = this.composeMessage(el.about, el.aboutData);

        organizationMessages_plain += '\t"' + messageContentObject.msg + '" received at ' + moment(el.timestamp).format('YYYY-MMM-DD') + '\nClick to see message: ' + messageContentObject.link + '\n';
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

  composeMessage(category, data) {
    switch (category) {
      case notificationCategory.IntroducingRep:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' asked you to be representative of ' + data.orgBiz_name,
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.UserUpdateProfile:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' was updated his/her profile data',
          link: baseLink + '/user/profile/' + data.person_id,
        };
        break;
      case notificationCategory.AcceptRepRequest:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' accepts your request to being representative of ' + data.org_biz_name + (data.is_business ?  ' business' : ' organization'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.RejectRepRequest:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' rejects your request to being representative ' + data.org_biz_name + (data.is_business ?  ' business' : ' organization'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.BusinessUpdateProfile:
        return {
          msg: 'Profile of ' + data.business_name + ' business was updated',
          link: baseLink + '/business/profile/' + data.business_id,
        };
        break;
      case notificationCategory.OrganizationUpdateProfile:
        return {
          msg: 'Profile of ' + data.organization_name + ' organization was updated',
          link: baseLink + '/organization/profile/' + data.organization_id,
        };
        break;
      case notificationCategory.UserAddExpertise:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' added new expertise "' + data.expertise_name + '"',
          link: baseLink + '/user/expertise/' + data.person_id,
        };
        break;
      case notificationCategory.UserUpdateExpertise:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' updated his/her expertise "' + data.expertise_name + '"',
          link: baseLink + '/user/expertise/' + data.person_id,
        };
        break;
      case notificationCategory.UserRemoveExpertise:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' deleted one expertise from his/her expertise list',
          link: baseLink + '/user/expertise/' + data.person_id,
        };
        break;
      case notificationCategory.PeopleAddPartnership:
        return {
          msg: this.getPersonNameOrUsername(data.person_name1, data.person_username1) + ' and ' + this.getPersonNameOrUsername(data.person_name2, data.person_username2) + ' have new partnership relation: "' + data.partnership_description + '"',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonConfirmPartnership:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' accepted your partnership request',
        link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonRequestPartnership:
        return {
          msg: 'Partnership request is received by ' + this.getPersonNameOrUsername(data.person_name, data.person_username) + '. ' + (data.partnership_description ? 'Description is ' + data.partnership_description : 'No description was defined'),
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.PersonRejectPartnershipRequest:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' rejected your partnership request.' + (data.partnership_description ? ' Description is ' + data.partnership_description : 'No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonRemovePartnership:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' remove a partnership.' + (data.partnership_description ? "Partnership's description is " + data.partnership_description : 'No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.BusinessAddProduct:
        return {
          msg: data.business_name + ' business has new "' + data.product_name + '" product',
          link: baseLink + '/business/product/' + data.business_id,
        };
        break;
      case notificationCategory.BusinessUpdateProduct:
        return {
          msg: data.business_name + ' business has updated its "' + data.product_name + '" product',
          link: baseLink + '/business/product/' + data.business_id,
        };
        break;
      case notificationCategory.BusinessRemoveProduct:
        return {
          msg: 'Business ' + data.business_name + ' remove its product "' + data.product_name + '"',
          link: baseLink + '/business/product/' + data.business_id,
        };
        break;
      case notificationCategory.BusinessAddLifeCycleEvent:
        return {
          msg: data.business_name + ' business added new life-cycle-event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/business/lce/' + data.business_id,
        };
        break;
      case notificationCategory.BusinessRequestLifeCycleEvent:
        return {
          msg: 'Life-Cycle-Event request is received by ' + data.business_name + ' business. ' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.BusinessRemoveLifeCycleEvent:
        return {
          msg: ((data.isAdmin) ? this.getPersonNameOrUsername(data.admin_name, data.admin_username) : data.business_name + ' business') + ' remove the life cycle event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/business/lce/' + data.business_id,
        };
        break;
      case notificationCategory.BusinessConfirmLifeCycleEvent:
        return {
          msg: data.business_name + ' business has confirmed your requested life cycle event',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.BusinessRejectLifeCycleEvent:
        return {
          msg: data.business_name + ' business rejected your life-cycle-event request.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.TwoBusinessAddLifeCycleEvent:
        return {
          msg: data.business_name1 + ' and ' + data.business_name2 + ' have new life cycle event.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.OrganizationAddLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization added new life-cycle-event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/organization/lce/' + data.organization_id,
        };
        break;
      case notificationCategory.OrganizationRequestLifeCycleEvent:
        return {
          msg: 'Life-Cycle-Event request is received by ' + data.organization_name + ' organization. ' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.OrganizationRemoveLifeCycleEvent:
        return {
          msg: ((data.isAdmin) ? this.getPersonNameOrUsername(data.admin_name, data.admin_username) : data.organization_name + ' organization') + ' remove the life cycle event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
          link: baseLink + '/organization/lce/' + data.organization_id,
        };
        break;
      case notificationCategory.OrganizationConfirmLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization has confirmed your requested life cycle event',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.OrganizationRejectLifeCycleEvent:
        return {
          msg: data.organization_name + ' organization rejected your life-cycle-event request.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.TwoOrganizationAddLifeCycleEvent:
        return {
          msg: data.organization_name1 + ' and ' + data.organization_name2 + ' have new life cycle event.' + (data.lce_description ? ' Description is ' + data.lce_description : ' No description was defined'),
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.UpdateBusinessOrganizationRep:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' accepted your request for being representative of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization'),
          link: baseLink + (data.is_business ? '/business/' : '/organization/') + 'profile/' + data.id,
        };
        break;
      case notificationCategory.OrganizerAddUpdateEvent:
        return {
          msg: this.getPersonNameOrUsername(data.organizer_name, data.organizer_username) + (data.is_updated ? ' updated' : ' added new') + " event. Event's title is " + data.event_description,
          link: baseLink + (data.is_person ? '/user/' : (data.is_business ? '/business/' : '/organization/')) + '/event/' + data.id,
        };
        break;
      case notificationCategory.OrganizerRemoveEvent:
        return {
          msg: this.getPersonNameOrUsername(data.organizer_name, data.organizer_username) + ' removed event "' + data.event_description + '"',
          link: baseLink + (data.is_person ? '/user/' : (data.is_business ? '/business/' : '/organization/')) + '/event/' + data.id,
        };
        break;
      case notificationCategory.XAttendsToEvent:
        return {
          msg: (data.is_person ? this.getPersonNameOrUsername(data.person_name, data.person_username) : (data.org_biz_name + (data.is_business ? ' business' : ' organization'))) + ' attends to "' + data.event_title + '" event',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.XDisregardForEvent:
        return {
          msg: (data.is_person ? this.getPersonNameOrUsername(data.person_name, data.person_username) : (data.org_biz_name + (data.is_business ? ' business' : ' organization'))) + ' disregard for "' + data.event_title + '" event',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonJoinTo:
        return {
          msg: 'You are the member of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization') + ' now',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonRejectJoinRequest:
        return {
          msg: 'Your request to being member of ' + data.org_biz_name + (data.is_business ? ' business' : ' organization') + ' is rejected',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonInvestsOnBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: baseLink + '/user/investments/' + data.id,
        };
        break;
      case notificationCategory.OrganizationInvestsOnBusiness:
        return {
          msg: data.organization_name + ' organization invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: baseLink + '/organization/investments/' + data.id,
        };
        break;
      case notificationCategory.PersonClaimInvestmentOnBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' claims that invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.OrganizationClaimInvestmentOnBusiness:
        return {
          msg: data.organization_name + ' organization claims that invests ' + data.amount + ' ' + data.currency + ' on ' + data.business_name + ' business',
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.AcceptInvestment:
        return {
          msg: 'Your claim (investing on ' + data.business_name + ' business) is approved',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.RemoveInvestmentOnBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' removes investing claim on ' + data.business_name,
          link: baseLink + '/business/investments/' + data.business_id,
        };
        break;
      case notificationCategory.RejectInvestmentOnBusiness:
        return {
          msg: 'Your claim (investing on ' + data.business_name + ' business) is rejected',
          link: baseLink + '/notifications',
        };
        break;
      case notificationCategory.PersonConsultingBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: baseLink + '/user/consulting/' + data.id,
        };
        break;
      case notificationCategory.OrganizationConsultingOnBusiness:
        return {
          msg: data.organization_name + ' organization advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: baseLink + '/organization/consulting/' + data.id,
        };
        break;
      case notificationCategory.PersonClaimConsultingBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' claims that advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.OrganizationClaimConsultingBusiness:
        return {
          msg: data.organization_name + ' organization claims that advises on ' + data.subject + ' to ' + data.business_name + ' business',
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.AcceptConsulting:
        return {
          msg: 'Your claim (advising to ' + data.business_name + ' business) is approved',
          link: baseLink + '/requests',
        };
        break;
      case notificationCategory.RemoveConsultancyOnBusiness:
        return {
          msg: this.getPersonNameOrUsername(data.person_name, data.person_username) + ' removes advising claim on ' + data.business_name,
          link: baseLink + '/business/investments/' + data.business_id,
        };
        break;
      case notificationCategory.RejectConsultancyOnBusiness:
        return {
          msg: 'Your claim (advising to ' + data.business_name + ' business) is rejected',
          link: baseLink + '/notifications',
        };
        break;
      default:
        return null;
        break;
    }
  }

  getPersonNameOrUsername(name, username){
    return (name === ' ' || name === '' || !name) ? username : name;
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