const promise = Promise;
const bCrypt = require('bcrypt-nodejs');
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
 * REDIS_PASSWORD
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

const appName = process.env.APP_NAME;
const appAddress = process.env.APP_ADDRESS;


/**
 * upload files
 */

uploadPath = "public/documents/profile-image";

/**
 * Mail Configs
 */
const mailConfig = {
  host: process.env.MAIL_CONFIG_HOST,
  port: process.env.MAIL_CONFIG_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_CONFIG_AUTH_USER,
    pass: process.env.MAIL_CONFIG_AUTH_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  from: process.env.MAIL_CONFIG_FROM
};
const mailPeriodConfig = {
  minute: 5,
  hour: 9,
  dayOfWeek: "Mon"
};

/**
 * Database
 */

const connectionString = process.env.PG_CONNECTION + process.env.DATABASE;
const db_name = process.env.DATABASE;
const test_db_name = process.env.DATABASE + '_test';
const testConnectionString = process.env.PG_CONNECTION + test_db_name;
const initDb = pgp(process.env.PG_CONNECTION + process.env.INIT_DB);
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
const redisURL = process.env.REDIS_URL;
const redisPass = process.env.REDIS_PASSWORD;

module.exports = {
  bCrypt,
  isProd: isProd,
  isDev: isDev,
  appAddress,
  appName,
  app,
  uploadPath,
  mailConfig,
  mailPeriodConfig,
  pgp,
  pgm,
  db,
  testDb,
  initDb,
  db_name,
  test_db_name,
  redisURL,
  redisPass
};