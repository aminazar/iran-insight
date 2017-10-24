/**
 * Created by Amin on 04/02/2017.
 */
let badPass = new Error("Incorrect password");
badPass.status = 401;

let noUser = new Error("Person not found");
noUser.status = 400;

let adminOnly = new Error("Admin only functionality");
adminOnly.status = 403;

let noPass = new Error("No password is set up");
noPass.status = 500;

let emptyUsername = new Error("Empty username is not allowed");
emptyUsername.status = 400;

let emptyEmail = new Error('Empty email is not allowed');
emptyEmail.status = 400;

let emptyName = new Error("Empty name is not allowed");
emptyName.status = 400;

let emailExist = new Error("Email is exist");
emailExist.status = 500;

let emailIsIncorrect = new Error("The email is incorrect");
emailIsIncorrect.status = 406;

let notAllowed = new Error("You cannot access to this functionality");
notAllowed.status = 403;

let expiredLink = new Error("Link is expired");
expiredLink.status = 404;

let modifyNotAllowed = new Error("Cannot modify user general profile");
modifyNotAllowed.status = 403;

let noId = new Error('No person id found');
noId.status = 404;

let duplicateLink = new Error('Error. Duplicate link');
duplicateLink.status = 500;

let noRecord = (criteria, tableName) => new Error(`No records with criteria: ${JSON.stringify(criteria)} in table ${tableName}`);
noRecord.status = 404;

let noUniqueRecord = (criteria, tableName) => new Error(`Not unique record with criteria: ${JSON.stringify(criteria)} in table ${tableName}`);
noUniqueRecord.status = 400;

let notEventOwnerBizRep = new Error('User is not representative of business that owns the event');
notEventOwnerBizRep.status = 403;

let notEventOwnerOrgRep = new Error('User is not representative of organization that owns the event');
notEventOwnerOrgRep.status = 403;

let notEventOwner = new Error('User does not own the event');
notEventOwner.status = 403;

let emptyOId1InLCETable = new Error("oid1 cannot be null for new LCE");
emptyOId1InLCETable.status = 420;

let emptyStartDateInLCETable = new Error("start date cannot be null for new LCE");
emptyStartDateInLCETable.status = 421;

let emptyOrgTypeName = new Error("name of organization type cannot be null");
emptyOrgTypeName.status = 422;

let emptyOrgName = new Error("name of organization cannot be null");
emptyOrgName.status = 423;

let notAttendeeBizRep = new Error("User is not representative of attendee business");
notAttendeeBizRep.status = 403;

let notAttendeeOrgRep = new Error("User is not representative of attendee organization");
notAttendeeOrgRep.status = 403;

module.exports = {
  badPass: badPass,
  noUser: noUser,
  adminOnly: adminOnly,
  noPass: noPass,
  emptyUsername: emptyUsername,
  emptyOId1InLCETable,
  emptyStartDateInLCETable,
  emptyOrgTypeName,
  emptyOrgName,
  emptyEmail: emptyEmail,
  emptyName: emptyName,
  emailExist: emailExist,
  emailIsIncorrect: emailIsIncorrect,
  noRecord: noRecord,
  noUniqueRecord: noUniqueRecord,
  notEventOwnerBizRep: notEventOwnerBizRep,
  notEventOwnerOrgRep: notEventOwnerOrgRep,
  notEventOwner: notEventOwner,
  notAllowed: notAllowed,
  notAttendeeBizRep: notAttendeeBizRep,
  notAttendeeOrgRep: notAttendeeOrgRep,
  expiredLink: expiredLink,
  modifyNotAllowed: modifyNotAllowed,
  noId: noId,
  duplicateLink: duplicateLink,
};