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

let emptyOId1InLCETable = new Error("oid1 cannot be null for new LCE");
emptyOId1InLCETable.status = 420;

let emptyStartDateInLCETable = new Error("start date cannot be null for new LCE");
emptyStartDateInLCETable.status = 421;

let emptyOrgTypeName = new Error("name of organization type cannot be null");
emptyOrgTypeName.status = 422;

let emptyOrgName = new Error("name of organization cannot be null");
emptyOrgName.status = 423;



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
};