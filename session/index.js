/**
 * Created by ali71 on 05/08/2017.
 */
const env = require('../env');
let session = require('express-session');
let redisStore = require('connect-redis')(session);
const redis = require('../redis');



let session_config;

let setup = (app) => {
  return new Promise((resolve,reject) => {
    redis.redisClientInit()
      .then(() => {
        let sessionStore = new redisStore(env.isProd ? {url: process.env.REDIS_URL} : {
          "client": redis.redis_client(),
          "host": "127.0.0.1",
          "port": 6379
        });

        session_config = {
          secret: 'ManKhazDI',
          key: 'connect.sid',
          cookie: {
            maxAge: 14 * 24 * 3600 * 1000
          },
          store: sessionStore,
          resave: false,
          saveUninitialized: false,
        };

        //Initialize session with settings for production
        if (env.isProd) {
          app.set('trust proxy', 1); //Trust first proxy
          session_config.cookie.secure = true; //Serve secure cookies
        }

        app.use(session(session_config));
        console.log('Session is set up');
        resolve();
      })
      .catch(reject);
  });
};

module.exports = {
  setup,
  session_config: () => session_config,
};