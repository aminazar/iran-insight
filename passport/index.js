/**
 * Created by ali71 on 05/08/2017.
 */
let lib = require('../lib');
let authDetails = require('./authDetails');
let passport = require('passport');
let LocalStrategy = require('passport-local');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
let FacebookStrategy = require('passport-facebook').Strategy;
let LinkedInStrategy = require('passport-linkedin').Strategy;

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
  }, lib.User.passportOAuthStrategy));

  passport.use(new FacebookStrategy({
    clientID: authDetails.facebookAuth.clientID,
    clientSecret: authDetails.facebookAuth.clientSecret,
    callbackURL: authDetails.facebookAuth.callBackURL,
    profileFields:  ['id', 'email', 'gender', 'name'],
    enableProof: true,
    passReqToCallback: true
  }, lib.User.passportOAuthStrategy));

  passport.use(new LinkedInStrategy({
    consumerKey: authDetails.linkedinAuth.clientID,
    consumerSecret: authDetails.linkedinAuth.clientSecret,
    callbackURL: authDetails.linkedinAuth.callBackURL,
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline'],
    passReqToCallback: true
  }, lib.User.passportOAuthStrategy));
};

module.exports = {
  setup
};