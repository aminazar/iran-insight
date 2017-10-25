const Type = require('./type.model');

class BusinessType extends Type {
  constructor(test = BusinessType.test) {
    BusinessType.test = test;
    super('business_type', test);
  }
}

BusinessType.test = false;
module.exports = BusinessType;