/**
 * types are those tables which has same logic in suggestion
 * @type {[string,string,string,string,string]}
 */
let types = [
  'business',
  'organization',
  'lce',
  'attendance',
  'position',
].map(name => name+'_type');

module.exports = types;

