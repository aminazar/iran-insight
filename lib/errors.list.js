/**
 * Created by Amin on 04/02/2017.
 */
let badPass = new Error("Incorrect password");
badPass.status = 401;

let noUser = new Error("User not found");
noUser.status = 400;

let adminOnly = new Error("Admin only functionality");
adminOnly.status = 403;

let noPass = new Error("No password is set up");
noPass.status = 500;

let emptyUsername = new Error("Empty username is not allowed");
emptyUsername.status = 400;

module.exports = {
  badPass: badPass,
  noUser: noUser,
  adminOnly: adminOnly,
  noPass: noPass,
  emptyUsername: emptyUsername,
};