const Type = require('./type.model');

class OrganizationType extends Type {
  constructor(test = OrganizationType.test) {
    OrganizationType.test = test;
    super('organization_type', test);
  }
}

OrganizationType.test = false;
module.exports = OrganizationType;