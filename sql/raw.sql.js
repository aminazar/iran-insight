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
        create: sql('db/create.sql'),
        drop: sql('db/drop.sql'),
        test: sql('db/test.sql'),
    },
    users: {
        create: sql('users/create.sql'),
        drop: sql('users/drop.sql'),
        get: sql('users/get.sql'),
        select: sql('users/select.sql'),
    },
    organization: {
        create: sql('organization/create.sql'),
        drop: sql('organization/drop.sql'),
        get: sql('organization/get.sql'),
        select: sql('organization/select.sql'),
    },
    organization_lce: {
        create: sql('organization_lce/create.sql'),
        drop: sql('organization_lce/drop.sql'),
        get: sql('organization_lce/get.sql'),
        select: sql('organization_lce/select.sql'),
    },
    organization_type: {
        create: sql('organization_type/create.sql'),
        drop: sql('organization_type/drop.sql'),
        get: sql('organization_type/get.sql'),
        select: sql('organization_type/select.sql'),
    },
    lce_type: {
        create: sql('lce_type/create.sql'),
        drop: sql('lce_type/drop.sql'),
        get: sql('lce_type/get.sql'),
        select: sql('lce_type/select.sql'),
    },
}
;