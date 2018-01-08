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
    row.amount = (row.amount !== undefined && row.amount !== null) ? +row.amount.substring(1).replace(',', '') : data.amount;
    return row;
  });
};

let setInvestmentCycle = (sql, business_id) => {
  return new Promise((resolve, reject) => {
    sql.getMaxColumn({bid: business_id})
      .then(res => {
        resolve(res[0].max ? (+res[0].max + 1) : 1);
      })
      .catch(reject);
  });
};

class Investment extends BizInput {
  constructor(test = Investment.test) {
    Investment.test = test;
    super(tableName, columns, test, idColumn, formatMoneyData, setInvestmentCycle);
  }
}

Investment.test = false;

module.exports = Investment;
