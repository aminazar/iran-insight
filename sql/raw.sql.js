/**
 * Created by Amin on 01/02/2017.
 */
const env = require('../env');
const QueryFile = env.pgp.QueryFile;
const path = require('path');

// Helper for linking to external query files:
function sql(file, fixedArgs) {
  let fullPath = path.join(__dirname, file); // generating full path;
  let QF = new QueryFile(fullPath, {minify: !env.isDev, debug: env.isDev});
  if(!fixedArgs)
    return QF;
  else
    return {query: QF, fixedArgs: fixedArgs};
}

/*
 * Add any new queries with nesting it in table then query name, then point to the SQL file for the query.
 * Do not forget to wrap the filename in 'sql()' function.
 * Put the SQL files for any new table/schema in a new directory
 * Use the same direcoty name for nesting the queries here.
 */
let modExp = {
  db: {
    create: sql('db/create.sql'),
    drop: sql('db/drop.sql'),
    test: sql('db/test.sql'),
  },
  person: {
    create:     sql('person/create.sql'),
    drop:       sql('person/drop.sql'),
    get:        sql('person/get.sql'),
    isAdmin:    sql('person/isAdmin.sql'),
    orgRep:     sql('person/orgRep.sql'),
    bizRep:     sql('person/bizRep.sql'),
    getListOfRepresentationRequests: sql('person/getListOfRepresentationRequests.sql'),
    getListOfMembershipRequests: sql('person/getListOfMembershipRequests.sql'),
  },
  expertise: {
    create: sql('expertise/create.sql'),
    drop: sql('expertise/drop.sql'),
  },
  person_expertise: {
    create: sql('person_expertise/create.sql'),
    drop: sql('person_expertise/drop.sql'),
  },

  organization: {
    create: sql('organization/create.sql'),
    drop: sql('organization/drop.sql'),
    getById: sql('organization/get_by_id.sql'),
    getAll: sql('organization/get_all.sql'),
  },
  organization_lce: {
    create: sql('organization_lce/create.sql'),
    drop: sql('organization_lce/drop.sql'),
    getById: sql('organization_lce/get_by_id.sql'),
    select: sql('organization_lce/select.sql'),
  },
  person_activation_link: {
    create:             sql('person_activation_link/create.sql'),
    drop:               sql('person_activation_link/drop.sql'),
    deleteByLink:       sql('person_activation_link/deleteByLink.sql'),
    get:                sql('person_activation_link/get.sql'),
    getByLink:          sql('person_activation_link/getByLink.sql'),
  },
  business: {
    create:     sql('business/create.sql'),
    drop:       sql('business/drop.sql'),
  },
  association: {
    create:     sql('association/create.sql'),
    drop:       sql('association/drop.sql'),
  },
  membership: {
    create:     sql('membership/create.sql'),
    drop:       sql('membership/drop.sql'),
    isRepresentative: sql('membership/isRepresentative.sql'),
  },
  event: {
    create:     sql('event/create.sql'),
    drop:       sql('event/drop.sql'),
  },
  attendance: {
    create:     sql('attendance/create.sql'),
    drop:       sql('attendance/drop.sql'),
    personUnattends: sql('attendance/person-unattend.sql'),
    bizUnattends: sql('attendance/biz-unattend.sql'),
    orgUnattends: sql('attendance/org-unattend.sql'),
  },
};

// Template-generated tables

// type tables
[
  'attendance',
  'position',
  'lce',
  'organization',
  'business',
].forEach(t => {
  let typeTableName = t + '_type';
  modExp[typeTableName] = {
    create:     sql('type/create.sql', {tableName: typeTableName}),
    drop:       sql('type/drop.sql', {tableName: typeTableName}),
    getByName:  sql('type/getByName.sql', {tableName: typeTableName}),
  }
});

module.exports = modExp;