/**
 * Created by ali71 on 05/08/2017.
 */
let lib = require('../lib');
let authDetails = require('./authDetails');
let passport = require('passport');
let LocalStrategy = require('passport-local');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

let setup = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(lib.User.serialize);
  passport.deserializeUser(lib.User.deserialize);
  passport.use(new LocalStrategy(
    {
      passReqToCallback: true,
    },
    lib.User.passportLocalStrategy
  ));

  passport.use(new GoogleStrategy({
    clientID: authDetails.googleAuth.clientID,
    clientSecret: authDetails.googleAuth.clientSecret,
    callbackURL: authDetails.googleAuth.callBackURL,
    passReqToCallback: true,
  }, lib.User.passportGoogleStrategy));
};

module.exports = {
  setup
};