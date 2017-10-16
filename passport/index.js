/**
 * Created by ali71 on 05/08/2017.
 */
let lib = require('../lib');
let passport = require('passport');
let LocalStrategy = require('passport-local');

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
};

module.exports = {
  setup
};