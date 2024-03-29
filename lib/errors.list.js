/**
 * Created by Amin on 04/02/2017.
 */
let badPass = new Error("Incorrect password");
badPass.status = 401;

let noUser = new Error("Person not found");
noUser.status = 400;

let adminOnly = new Error("Only admin can do this.");
adminOnly.status = 403;

let noEndDate = new Error('No end date found');
noEndDate.status = 404;

let notRegister = new Error('You have not been registered yet.');
notRegister.status = 403;

let noPass = new Error("No password is set up");
noPass.status = 500;

let noIdColumn = new Error("No id column is declared");
noIdColumn.status = 404;

let noIdSet = new Error("No id is set");
noIdSet.status = 404;

let noFieldName = new Error("No field-name is declared");
noFieldName.status = 404;

let sameLCEIds = new Error("same ids for lce joiners is not allowed");
sameLCEIds.status = 404;

let emptyUsername = new Error("Empty username is not allowed");
emptyUsername.status = 400;

let emptyEmail = new Error("Empty email is not allowed");
emptyEmail.status = 400;

let emptyName = new Error("Empty name is not allowed");
emptyName.status = 400;

let emailExist = new Error("Email already exists");
emailExist.status = 500;

let emailIsIncorrect = new Error("The email is incorrect");
emailIsIncorrect.status = 406;

let notAllowed = new Error("You cannot access to this functionality");
notAllowed.status = 403;

let expiredLink = new Error("Link is expired");
expiredLink.status = 404;

let modifyNotAllowed = new Error("Cannot modify user general profile");
modifyNotAllowed.status = 403;

let noId = new Error("No person id found");
noId.status = 404;

let noTable = new Error("No table is declared");
noTable.status = 404;

let tableNotFound = new Error("Declared table is not found");
tableNotFound.status = 404;

let noNotifyType = new Error("No notify type is specified");
noNotifyType.status = 404;

let illegalTypeName = new Error("illegal type name is specified");
illegalTypeName.status = 404;

let incorrectNotifyType = new Error("Incorrect notify type is specified");
incorrectNotifyType.status = 404;

let noPartnershipId = new Error("No partnership id found");
noPartnershipId.status = 404;

let noLCEId = new Error("No lce id found");
noLCEId.status = 404;

let noOrgId = new Error("No organization id found");
noOrgId.status = 404;

let noBizId = new Error("No Business id found");
noBizId.status = 404;

let noType = new Error("No type found");
noType.status = 404;

let hasRepresentative = new Error("this organization or business already has representative");
hasRepresentative.status = 500;

let membershipIsFinished = new Error("This membership has finished before.");
membershipIsFinished.status = 500;

let noBizOrOrgDeclared = new Error("No business or organization id is declared");
noBizOrOrgDeclared.status = 500;

let noBusinessIdDeclare = new Error("No business id is declared");
noBusinessIdDeclare.status = 500;

let noOrganizationIdDeclare = new Error("No organization id is declared");
noOrganizationIdDeclare .status = 500;

let noProductDeclare = new Error("No product data is declared");
noProductDeclare.status = 500;

let noProductId = new Error("No product id found");
noProductId.status = 404;

let noExpertiseId = new Error("No expertise id found");
noExpertiseId.status = 404;

let duplicateLink = new Error("Error. Duplicate link");
duplicateLink.status = 500;

let noRecord = (criteria, tableName) => new Error(`No records with criteria: ${JSON.stringify(criteria)} in table ${tableName}`);
noRecord.status = 404;

let noUniqueRecord = (criteria, tableName) => new Error(`Not unique record with criteria: ${JSON.stringify(criteria)} in table ${tableName}`);
noUniqueRecord.status = 400;

let notEventOwnerBizRep = new Error("User is not representative of business that owns the event");
notEventOwnerBizRep.status = 403;

let notEventOwnerOrgRep = new Error("User is not representative of organization that owns the event");
notEventOwnerOrgRep.status = 403;

let notEventOwner = new Error("User does not own the event");
notEventOwner.status = 403;

let notLoggedInUser = new Error("You are not logged in now");
notLoggedInUser.status = 400;

let emptyOId1InLCETable = new Error("oid1 cannot be null for new LCE");
emptyOId1InLCETable.status = 420;

let emptyStartDateInLCETable = new Error("start date cannot be null for new LCE");
emptyStartDateInLCETable.status = 421;

let emptyTypeName = new Error("name of type cannot be null");
emptyTypeName.status = 422;

let emptyOrgName = new Error("name of organization cannot be null");
emptyOrgName.status = 423;

let notAttendeeBizRep = new Error("User is not representative of attendee business");
notAttendeeBizRep.status = 403;

let notAttendeeOrgRep = new Error("User is not representative of attendee organization");
notAttendeeOrgRep.status = 403;

let notBizRep = new Error("User is not representative of business");
notBizRep.status = 403;

let bizNotFound = new Error("Business with this id not found");
bizNotFound.status = 404;

let orgNotFound = new Error("Organization with this id not found");
orgNotFound.status = 404;

let incorrectEndDate = new Error("The end date cannot be before start date");
incorrectEndDate.status = 500;

let notOrgRep = new Error("User is not representative of organization");
notOrgRep.status = 403;

let badMembership = new Error("Bad membership data");
badMembership.status = 500;

let badDataInRequest = new Error("Bad data in request");
badDataInRequest.status = 400;

let badDataInDatabase = new Error("Inconsistent data in database, please call admin");
badDataInDatabase.status = 500;

let notRepOf = new Error("Representative of neither side of investment/consultancy");
notRepOf.status = 403;

let notConfirmer = new Error("You are not the person who can confirm this");
notConfirmer.status = 403;

let notAbleToFinishThisMembership = new Error("you are not allowed to finish this membership.");
notAbleToFinishThisMembership.status = 403;

let notAbleToChangePosition = new Error("you are not allowed to change the position of this membership.");
notAbleToChangePosition.status = 403;

let notValidEndDate = new Error("End date is not valid");
notValidEndDate.status = 403;

let noTagName= new Error("Tag name is not specified");
noTagName.status = 403;



module.exports = {
  badPass,
  noUser,
  adminOnly,
  noPass,
  emptyUsername,
  emptyOId1InLCETable,
  emptyStartDateInLCETable,
  emptyTypeName,
  emptyOrgName,
  emptyEmail,
  emptyName,
  emailExist,
  emailIsIncorrect,
  noRecord,
  noUniqueRecord,
  notEventOwnerBizRep,
  notEventOwnerOrgRep,
  notEventOwner,
  notLoggedInUser,
  notAllowed,
  noIdSet,
  notAttendeeBizRep,
  notAttendeeOrgRep,
  expiredLink,
  modifyNotAllowed,
  noId,
  duplicateLink,
  notBizRep,
  notOrgRep,
  badMembership,
  hasRepresentative,
  membershipIsFinished,
  notAbleToFinishThisMembership,
  notValidEndDate,
  notAbleToChangePosition,
  noBizOrOrgDeclared,
  noExpertiseId,
  badDataInRequest,
  badDataInDatabase,
  notRepOf,
  notConfirmer,
  noPartnershipId,
  noLCEId,
  noOrgId,
  noBizId,
  noBusinessIdDeclare,
  noProductDeclare,
  noProductId,
  noNotifyType,
  incorrectNotifyType,
  illegalTypeName,
  noType,
  noTable,
  tableNotFound,
  noIdColumn,
  noFieldName,
  notRegister,
  sameLCEIds,
  noTagName,
  bizNotFound,
  incorrectEndDate,
  noEndDate,
  noOrganizationIdDeclare,
  orgNotFound,
};
