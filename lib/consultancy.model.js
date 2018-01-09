const BizInput = require('./biz-input.model');

let tableName = 'consultancy';
let idColumn = 'id';
let columns = [
  "assoc_id",
  "is_mentor",
  "claimed_by",
  "confirmed_by",
  "is_claimed_by_biz",
  "is_confirmed",
  "saved_at",
  "subject",
  "subject_fa",
];

class Consultancy extends BizInput {
  constructor(test = Consultancy.test) {
    Consultancy.test = test;
    super(tableName,columns, test, idColumn);
  }
}

Consultancy.test = false;

module.exports = Consultancy;
