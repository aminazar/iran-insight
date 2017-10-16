/**
 * Created by Amin on 01/02/2017.
 */
const env = require('../env');
const QueryFile = env.pgp.QueryFile;
const path = require('path');

// Helper for linking to external query files:
function sql(file) {
  let fullPath = path.join(__dirname, file); // generating full path;
  return new QueryFile(fullPath, {minify: true, debug: env.isDev});
}
/*
 * Add any new queries with nesting it in table then query name, then point to the SQL file for the query.
 * Do not forget to wrap the filename in 'sql()' function.
 * Put the SQL files for any new table/schema in a new directory
 * Use the same direcoty name for nesting the queries here.
 */
module.exports = {
  db: {
    create:   sql('db/create.sql'),
    drop:     sql('db/drop.sql'),
    test:     sql('db/test.sql'),
  },
  users: {
    create:   sql('users/create.sql'),
    drop:     sql('users/drop.sql'),
    get:      sql('users/get.sql'),
    select:   sql('users/select.sql'),
  },
};