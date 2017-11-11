let cron = require('node-cron');
let {mailPeriodConfig} = require('../env');
const sql = require('../sql');
const helpers = require('./helpers');

let notificationCategory = {
  Registration: 'registration',
  IntroducingRep: 'introducing-rep',
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
  BusinessAddProduct: 'business-add-product',
  BusinessUpdateProduct: 'business-update-product',
  BusinessRemoveProduct: 'business-remove-product',
  BusinessAddLifeCycleEvent: 'business-add-life-cycle-event',
  BusinessRequestLifeCycleEvent: 'business-request-life-cycle-event',
  BusinessRemoveLifeCycleEvent: 'business-remove-life-cycle-event',
  BusinessConfirmLifeCycleEvent: 'business-confirm-life-cycle-event',
  BusinessRejectLifeCycleEvent: 'business-reject-life-cycle-event',
  OrganizationAddLifeCycleEvent: 'organization-add-life-cycle-event',
  OrganizationRemoveLifeCycleEvent: 'organization-remove-life-cycle-event',
  OrganizationRepresentativeConfirmLifeCycleEvent: 'organization-representative-confirm-life-cycle-event',
  UpdateBusinessOrganizationRep: 'update-business-organization-rep',
  PersonAddUpdateEvent: 'person-add-event',
  PersonRemoveEvent: 'person-remove-event',
  PersonAttendsToEvent: 'person-attend-to-event',
  BusinessAttendsToEvent: 'business-attend-to-event',
  OrganizationAttendsToEvent: 'organization-attend-to-event',
  PersonJoinTo: 'person-join-to',
  PersonInvestsOnBusiness: 'person-invest-business',
  OrganizationInvestsOnBusiness: 'organization-invest-business',
  UpdatePersonalInvestment: 'update-personal-investment',
  UpdateOrganizationalInvestment: 'update-organizational-investment',
  ConfirmPersonalInvestment: 'confirm-personal-investment',
  ConfirmOrganizationalInvestment: 'confirm-organizational-investment',
  RemoveInvestmentOnBusiness: 'remove-investment-business',
  PersonConsultingBusiness: 'person-consulting-business',
  OrganizationConsultingOnBusiness: 'organization-consulting-business',
  UpdatePersonalConsultancy: 'update-personal-consultancy',
  UpdateOrganizationalConsultancy: 'update-organizational-consultancy',
  ConfirmPersonalConsultancy: 'confirm-personal-consultancy',
  ConfirmOrganizationalConsultancy: 'confirm-organizational-consultancy',
  RemoveConsultancyOnBusiness: 'remove-consultancy-business',
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
    this.sql = test ? sql.test : sql;
    this.dailyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * *`, () => {
      this.sendMailToRecipient('d');
    });

    this.weeklyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * ${mailPeriodConfig.dayOfWeek}`, () => {
      this.sendMailToRecipient('w');
    });

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

  static fetChNotifications(pid) {

    return [`note 1 for user ${pid}`,
      `note 2 for user ${pid}`,
      `note 3 for user ${pid}`]

  };

  static getNotificationCategory() {
    return notificationCategory;
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

    console.log('Notification system is running ');

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
          msg: (data.person_name1 !== ' ' ? data.person_name1 : data.person_username)+ ' and ' + (data.person_name2 !== ' ' ? data.person_name2 : data.person_username) + ' have new partnership relation: "' + data.partnership_description + '"',
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
      case notificationCategory.BusinessAddProduct:
        return {
          msg:  data.business_name + ' business has new "' + data.product_name + '" product',
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
          msg: data.business_name + ' business add new life-cycle-event.' + (data.lce_description ? 'Description is ' + data.lce_description : 'No description was defined'),
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
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.BusinessConfirmLifeCycleEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.BusinessRejectLifeCycleEvent:
        return {
          msg: (data.person_name !== ' ' ? data.person_name : data.person_username) + ' rejected your life-cycle-event request.' + (data.lce_description ? ' Description is ' + data.lce_description : 'No description was defined'),
          link: '',
        };
        break;
      case notificationCategory.OrganizationAddLifeCycleEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.OrganizationRemoveLifeCycleEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.OrganizationRepresentativeConfirmLifeCycleEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.UpdateBusinessOrganizationRep:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonAddUpdateEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonRemoveEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonAttendsToEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.BusinessAttendsToEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.OrganizationAttendsToEvent:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonJoinTo:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonInvestsOnBusiness:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.OrganizationInvestsOnBusiness:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.UpdatePersonalInvestment:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.UpdateOrganizationalInvestment:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.ConfirmPersonalInvestment:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.ConfirmOrganizationalInvestment:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.RemoveInvestmentOnBusiness:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.PersonConsultingBusiness:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.OrganizationConsultingOnBusiness:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.UpdatePersonalConsultancy:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.UpdateOrganizationalConsultancy:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.ConfirmPersonalConsultancy:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.ConfirmOrganizationalConsultancy:
        return {
          msg: '',
          link: '',
        };
        break;
      case notificationCategory.RemoveConsultancyOnBusiness:
        return {
          msg: '',
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

module.exports = NotificationSystem;