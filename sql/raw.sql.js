/**
 * Created by Amin on 01/02/2017.
 */
const env = require('../env');
const QueryFile = env.pgp.QueryFile;
const path = require('path');
const types = require('./types');

let cache = {};

// Helper for linking to external query files:
function sql(file, fixedArgs) {
  let QF = cache[file];
  if (!QF) {
    let fullPath = path.join(__dirname, file); // generating full path;
    QF = new QueryFile(fullPath, {minify: !env.isDev, debug: env.isDev});
    cache[file] = QF;
  }
  if (!fixedArgs)
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
    test: sql('db/test.js.sql'),
  },
  person: {
    create: sql('person/create.sql'),
    drop: sql('person/drop.sql'),
    get: sql('person/get.sql'),
    isAdmin: sql('person/isAdmin.sql'),
    orgRep: sql('person/orgRep.sql'),
    bizRep: sql('person/bizRep.sql'),
    getUserById: sql('person/getUserById.sql'),
    getListOfRepresentationRequests: sql('person/getListOfRepresentationRequests.sql'),
    getPersonExpertise: sql('person/getPersonExpertise.sql'),
    deleteExpertiseById: sql('person/deleteExpertiseById.sql'),
    getAdmins: sql('person/getAdmins.sql'),
    updatePass: sql('person/updatePass.sql'),

  },
  partnership: {
    create: sql('partnership/create.sql'),
    drop: sql('partnership/drop.sql'),
    getFromById: sql('partnership/getFromById.sql'),
    getConfirmedById: sql('partnership/getConfirmedById.sql'),
    getRequestedById: sql('partnership/getRequestedById.sql'),
    getPartnershipList: sql('partnership/getPartnershipList.sql'),
    getPartnershipDetail: sql('partnership/getPartnershipDetail.sql'),
  },

  administrators: {
    create: sql('administrators/create.sql'),
    getById: sql('administrators/getById.sql'),
    drop: sql('administrators/drop.sql'),
  },
  expertise: {
    create: sql('expertise/create.sql'),
    drop: sql('expertise/drop.sql'),
    get: sql('expertise/get.sql'),
  },
  person_expertise: {
    create: sql('person_expertise/create.sql'),
    drop: sql('person_expertise/drop.sql'),
    getByIds: sql('person_expertise/getByIds.sql'),
  },
  organization: {
    create: sql('organization/create.sql'),
    drop: sql('organization/drop.sql'),
    getById: sql('organization/get_by_id.sql'),
    getAll: sql('organization/get_all.sql'),
    get: sql('organization/get.sql'),
  },
  organization_lce: {
    create: sql('organization_lce/create.sql'),
    drop: sql('organization_lce/drop.sql'),
    getAll: sql('organization_lce/getLCEList.sql'),
    getRequested: sql('organization_lce/getRequested.sql'),
    getConfirmed: sql('organization_lce/getConfirmed.sql'),
    getOrganizationLCEData: sql('organization_lce/getOrganizationLCEData.sql'),
  },
  person_activation_link: {
    create: sql('person_activation_link/create.sql'),
    drop: sql('person_activation_link/drop.sql'),
    deleteByLink: sql('person_activation_link/deleteByLink.sql'),
    get: sql('person_activation_link/get.sql'),
    getByLink: sql('person_activation_link/getByLink.sql'),
    deleteByPID: sql('person_activation_link/deleteByPID.sql'),
    getByLinkUsername: sql('person_activation_link/getByLinkUsername.sql'),
  },
  business: {
    create: sql('business/create.sql'),
    drop: sql('business/drop.sql'),
    get: sql('business/get.sql'),
    getBusinessProducts: sql('business/getBusinessProducts.sql'),
    getOne: sql('business/getOne.sql'),
    delete: sql('business/delete.sql'),
  },
  business_lce: {
    create: sql('lce/create.sql'),
    drop: sql('lce/drop.sql'),
    getAll: sql('lce/getLCEList.sql'),
    getRequested: sql('lce/getRequested.sql'),
    getConfirmed: sql('lce/getConfirmed.sql'),
    get: sql('lce/get.sql'),
    getBusinessLCEData: sql('lce/getLCEData.sql'),
  },
  association: {
    create: sql('association/create.sql'),
    drop: sql('association/drop.sql'),
    get: sql('association/get.sql'),
    getSpecialAssoc: sql('association/getSpecialAssoc.sql'),
  },
  membership: {
    create: sql('membership/create.sql'),
    drop: sql('membership/drop.sql'),
    isRepresentativeOrAdmin: sql('membership/isRepresentativeOrAdmin.sql'),
    getWithAssoc: sql('membership/getWithAssoc.sql'),
    getWithLimitedAssoc: sql('membership/getWithLimitedAssoc.sql'),
    repPendingUsers: sql('membership/repPendingUsers.sql'),
    getBizRep: sql('membership/getBizRep.sql'),
    getOrgRep: sql('membership/getOrgRep.sql'),
    get: sql('membership/get.sql'),
    getAllSameAssocIDsFromMembership: sql('membership/getAllSameAssocIDsFromMembership.sql'),
    checkIfRepIsExist: sql('membership/checkIfRepIsExist.sql'),
    getBizOrgNameById: sql('membership/getBizOrgNamesById.sql'),
    getOrgBizMembers: sql('membership/getOrgBizMembers.sql'),
  },
  event: {
    create: sql('event/create.sql'),
    drop: sql('event/drop.sql'),
    getById: sql('event/getById.sql'),
  },
  attendance: {
    create: sql('attendance/create.sql'),
    drop: sql('attendance/drop.sql'),
    personUnattends: sql('attendance/person-unattend.sql'),
    bizUnattends: sql('attendance/biz-unattend.sql'),
    orgUnattends: sql('attendance/org-unattend.sql'),
    getAttendees: sql('attendance/getAttendees.sql'),
  },
  product: {
    create: sql('product/create.sql'),
    drop: sql('product/drop.sql'),
    getById: sql('product/getById.sql'),
    getAll: sql('product/getAll.sql'),
    getByProductId: sql('product/getByProductId.sql'),
    getByBiz: sql('product/getByBiz.sql'),
    getOne: sql('product/getOne.sql'),
  },
  business_product: {
    create: sql('business_product/create.sql'),
    drop: sql('business_product/drop.sql'),
    removeBizProduct: sql('business_product/removeBizProduct.sql'),
    getAllProducts: sql('business_product/getAllProducts.sql'),
    getByBizProductId: sql('business_product/getByBizProductId.sql'),
    deleteBizProductByAdmin: sql('business_product/deleteBizProductByAdmin.sql'),
  },
  subscription: {
    create: sql('subscription/create.sql'),
    drop: sql('subscription/drop.sql'),
    getBizSubscribers: sql('subscription/getBizSubscribers.sql'),
    getOrgSubscribers: sql('subscription/getOrgSubscribers.sql'),
    getPersonSubscribers: sql('subscription/getPersonSubscribers.sql'),
    unsubscribeBiz: sql('subscription/unsubscribeBiz.sql'),
    unsubscribeOrg: sql('subscription/unsubscribeOrg.sql'),
    unsubscribePerson: sql('subscription/unsubscribePerson.sql'),
  },
  tag: {
    create: sql('tag/create.sql'),
    drop: sql('tag/drop.sql'),
    appendTagToTarget: sql('tag/appendTagToTarget.sql'),
    removeTagFromTarget: sql('tag/removeTagFromTarget.sql'),
    getActiveTags: sql('tag/getActiveTags.sql'),
  },
  tag_connection: {
    create: sql('tag_connection/create.sql'),
    drop: sql('tag_connection/drop.sql'),
    recalculateAffiliation: sql('tag_connection/recalculateAffiliation.sql'),
  },
  search: {
    searchOnPerson: sql('search/searchOnPerson.sql'),
    searchOnBusiness: sql('search/searchOnBusiness.sql'),
    searchOnProduct: sql('search/searchOnProduct.sql'),
    searchOnOrganization: sql('search/searchOnOrganization.sql'),
    searchOnLCE: sql('search/searchOnLCE.sql'),
    searchOnEvent: sql('search/searchOnEvent.sql'),
    searchOnExpertise: sql('search/searchOnExpertise.sql'),
    searchOnInvestment: sql('search/searchOnInvestment.sql'),
    searchOnConsultancy: sql('search/searchOnConsultancy.sql'),
    searchOnType: sql('search/searchOnType.sql'),
    searchOnTags: sql('search/searchOnTags.sql'),
  },
  suggest: {
    suggestion: sql('suggest/suggestion.sql'),
  }
};

// Template-generated tables
let extraSQLMap = {
  investment: `amount money,
    currency char(3),
    investment_cycle smallint,
    is_lead boolean not null default false,
    constraint currency_amount check((amount is null and currency is null) or (amount is not null and currency is not null)),`,
  consultancy: `is_mentor boolean not null default false,
    subject varchar(100),
    subject_fa varchar(100),`,
  lce_type: `is_killer boolean default false,`,
  attendance_type: `is_vip boolean default false,
    is_sponsor boolean default false,`,
};
// type tables

types.forEach(t => {
  let extraSQL = extraSQLMap[t] ? extraSQLMap[t] : '';
  modExp[t] = {
    create: sql('type/create.sql', {tableName: t, extraSQL}),
    drop: sql('type/drop.sql', {tableName: t}),
    getByName: sql('type/getByName.sql', {tableName: t}),
    getInfo: sql('type/getInfo.sql', {tableName: t}),
    getByActive: sql('type/getByActive.sql', {tableName: t}),
  }
});

['business', 'organization'].forEach(t => {

  let tableName = `${t}_lce`;
  let possessorName = t;
  let possessorIdName = t === 'business' ? 'bid' : 'oid';

  modExp[tableName] = {
    create: sql('lce/create.sql', {tableName}),
    drop: sql('lce/drop.sql', {tableName}),
    get: sql('lce/get.sql', {tableName}),
    getLCEList: sql('lce/getLCEList.sql', {tableName, possessorName, possessorIdName}),
    getLCEDetail: sql('lce/getLCEDetail.sql', {tableName, possessorName, possessorIdName})
  }
});


// biz input tables
[
  'investment',
  'consultancy',
].forEach(t => {
  let extraSQL = extraSQLMap[t] ? extraSQLMap[t] : '';
  let param = {tableName: t};
  modExp[t] = {
    create: sql('biz-input/create.sql', {tableName: t, extraSQL}),
    drop: sql('biz-input/drop.sql', param),
    getByBiz: sql('biz-input/getByBiz.sql', param),
    getByOrg: sql('biz-input/getByOrg.sql', param),
    getByPerson: sql('biz-input/getByPerson.sql', param),
    getPendingByBiz: sql('biz-input/getPendingByBiz.sql', param),
    getPendingByOrg: sql('biz-input/getPendingByOrg.sql', param),
    getPendingByPerson: sql('biz-input/getPendingByPerson.sql', param),
    getWithAssoc: sql('biz-input/getWithAssoc.sql', param),
    getDetails: sql('biz-input/getDetails.sql', param),
    getMaxColumn: sql('biz-input/getMaxColumn.sql', {tableName: t, col: 'investment_cycle'}),
  }
});

module.exports = modExp;