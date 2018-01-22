const promise = Promise;
const bcrypt = require('bcrypt-nodejs');
const app = require('express')();
const options = {
  promiseLib: promise,
};
const pgp = require('pg-promise')(options);
let env = app.get('env');
if (env === 'test')
  env = 'development';
const isProd = env === 'production';
const isDev = env === 'development';

/**
 * read environment variable form env.process
 * in dev or test mode the environment variables are made from .env file
 * .env file must at least contains:
 * APP_NAME
 APP_ADDRESS
 * INIT_DB
 * DATABASE
 * PG_CONNECTION
 * REDIS_URL
 * (or
 * REDIS_HOST
 * REDIS_PASSWORD
 * )
 * MAIL_CONFIG_HOST
 * MAIL_CONFIG_PORT
 * MAIL_CONFIG_AUTH_USER
 * MAIL_CONFIG_AUTH_PASS
 * for example:
 * PG_CONNECTION=postgres://postgres:some_password@localhost:5432/
 */
if (isDev)
  require('dotenv').config(); // loads env variables inside .env file into process.env

/**
 *  App
 */

const appName = getEnvValue(process.env.APP_NAME);
const appAddress = getEnvValue(process.env.APP_ADDRESS);
const port = getEnvValue(process.env.PORT);


/**
 * upload files
 */

uploadPath = "public/documents/profile-image";

/**
 * Mail Configs
 */
const mailConfig = {
  host: getEnvValue(process.env.MAIL_CONFIG_HOST),
  port: getEnvValue(process.env.MAIL_CONFIG_PORT),
  secure: true,
  auth: {
    user: getEnvValue(process.env.MAIL_CONFIG_AUTH_USER),
    pass: getEnvValue(process.env.MAIL_CONFIG_AUTH_PASS)
  },
  tls: {
    rejectUnauthorized: false
  },
  from: getEnvValue(process.env.MAIL_CONFIG_FROM)
};
const mailPeriodConfig = {
  minute: 5,
  hour: 9,
  dayOfWeek: "Mon"
};

/**
 * Database
 */
const pgConnection = getEnvValue(process.env.PG_CONNECTION);
const database = getEnvValue(process.env.DATABASE);
const connectionString = getEnvValue(process.env.PG_CONNECTION) + getEnvValue(process.env.DATABASE);
const db_name = getEnvValue(process.env.DATABASE);
const test_db_name = getEnvValue(process.env.DATABASE) + '_test';
const testConnectionString = getEnvValue(process.env.PG_CONNECTION) + test_db_name;
const initDb = pgp(getEnvValue(process.env.PG_CONNECTION) + getEnvValue(process.env.INIT_DB));
const db = pgp(connectionString);
const testDb = pgp(testConnectionString);
const pgm = require('pg-monitor');
const color = require("cli-color");

const pgmTheme = {
  time: color.bgBlack.whiteBright,
  value: color.black,
  cn: color.black.bold,
  tx: color.cyan,
  paramTitle: color.magenta,
  errorTitle: color.redBright,
  query: color.bgBlue.whiteBright.bold,
  special: color.bgYellowBright.black.bold,
  error: color.red
};
pgm.setTheme(pgmTheme); // selecting your own theme;
pgm.attach(options);


/**
 * Redis
 */
const redisURL = getEnvValue(process.env.REDIS_URL);
const redisHost = getEnvValue(process.env.REDIS_HOST);
const redisPass = getEnvValue(process.env.REDIS_PASSWORD);

/**
 *  in some cases env var name which is declared in .env file is not compatible with server env var in production mode.
 *  for example in Heroku the name of env var for database connection is DATABASE_URL, but it is declared as pg_connection in .env file
 *  To resolve this if the name of env var contains !! at first, its value will be extracted from name after this two character
 * @param procEnv
 * @returns {*}
 */
function getEnvValue(procEnv) {
  if (procEnv && procEnv.startsWith('!!'))
    return process.env[procEnv.substring(2)]; // remove two first char (!!)
  else
    return procEnv;
}

module.exports = {
  bcrypt,
  isProd: isProd,
  isDev: isDev,
  appAddress,
  appName,
  app,
  port,
  uploadPath,
  mailConfig,
  mailPeriodConfig,
  pgp,
  pgm,
  database,
  pgConnection,
  db,
  testDb,
  initDb,
  db_name,
  test_db_name,
  redisURL,
  redisHost,
  redisPass
};