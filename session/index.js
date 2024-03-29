/**
 * Created by ali71 on 05/08/2017.
 */
const env = require('../env');
let session = require('express-session');
let redisStore = require('connect-redis')(session);
const redis = require('../redis');
let session_config;



let setup = (app) => {
  return new Promise(resolve => {
    redis.redisClientInit()
      .then(() => {

      let option = {
          "client": redis.redis_client(),
          "host": env.redisHost,
          "port": 6379
        };
        let conn = env.redisURL ? env.redisURL : option;
        let sessionStore = new redisStore(conn);

        //Initialize session with settings for production
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

        if (env.isProd) {
          app.set('trust proxy', 1); //Trust first proxy
          session_config.cookie.secure = true; //Serve secure cookies
        }

        app.use(session(session_config));

        console.log('Session set up.');

        resolve();
      })
      .catch(err => {
        console.log('error connecting redis', err);
        process.exit(1);
      });
  });

};

module.exports = {
  setup:setup,
  session_config: () => session_config,
};
