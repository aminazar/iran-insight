const promise = Promise;
const bCrypt = require('bcrypt-nodejs');
const options = {
  promiseLib: promise,
};
const pgp = require('pg-promise')(options);
const app = require('express')();
let env = app.get('env');
if(env==='test')
  env='development';
const isProd = env==='production';
const isDev  = env==='development';
const config = require('./config.json')[env];
const mailConfig = config.mailConfig;
const mailPeriodConfig = config.mailPeriodConfig;
const connectionString = config.pgConnection + config.database;
const test_db_name = config.database + '_test';
const testConnectionString = config.pgConnection + test_db_name;
const initDb =  pgp(config.pgConnection + config.initDb);
const db = pgp(connectionString);
const testDb = pgp(testConnectionString);
const pgm = require('pg-monitor');
const color = require("cli-color");
const path = require('path');

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

module.exports = {
  bcrypt: bCrypt,
  pgp: pgp,
  pgm: pgm,
  app: app,
  config: config,
  mailConfig: mailConfig,
  mailPeriodConfig,
  db: db,
  testDb : testDb,
  initDb: initDb,
  db_name: config.database,
  test_db_name: test_db_name,
  uploadPath: config.uploadPath,
  isProd: isProd,
  isDev: isDev,
  appAddress: config.appAddress,
};