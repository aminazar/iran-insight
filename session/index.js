/**
 * Created by ali71 on 05/08/2017.
 */
const env = require('../env');
let session = require('express-session');
let redisStore = require('connect-redis')(session);
const redis = require('../redis').redis_client;

var sessionStore = new redisStore({
  "client": redis,
  "host": "127.0.0.1",
  "port": 6379
});

let session_config = {
  secret: 'HosKhedIDA',
  key: 'connect.sid',
  cookie: {
    maxAge: 14*24*3600*1000
  },
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
};

let setup = (app) => {
  session_config.store = sessionStore;

  //Initialize session with settings for production
  if(env._env === 'production'){
    app.set('trust proxy', 1); //Trust first proxy
    session_config.cookie.secure = true; //Serve secure cookies
  }

  app.use(session(session_config));
};

module.exports = {
  setup,
  session_config
};