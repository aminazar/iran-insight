const BizInput = require('./biz-input.model');

let tableName = 'investment';
let idColumn = 'id';
let columns = [
  "assoc_id",
  "amount",
  "currency",
  "investment_cycle",
  "is_lead",
  "claimed_by",
  "confirmed_by",
  "is_claimed_by_biz",
  "is_confirmed",
  "saved_at",
];

let formatMoneyData = data => {
  return data.map(row => {
    row.amount = (row.amount !== undefined && row.amount !== null) ? row.amount.substring(1).replace(/,/g, '') : data.amount;
    return row;
  });
};

class Investment extends BizInput {
  constructor(test = Investment.test) {
    Investment.test = test;
    super(tableName, columns, test, idColumn, formatMoneyData);
  }
}

Investment.test = false;

module.exports = Investment;
