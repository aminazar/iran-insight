const sql = require('../sql');
const helpers = require('./helpers');

let targetArea = {
  person: true,
  business: true,
  product: true,
  organization: true,
  lce: true,
  event: true,
  expertise: true,
  investment: true,
  consultancy: true,
};
let limitation = 10;
let searchDir = 'search';

class SearchSystem {
  constructor(test = SearchSystem.test) {
    this.sqlTable = test ? sql.test[searchDir] : sql[searchDir];
  }

  search(queryObject, offset) {
    return new Promise((resolve, reject) => {
      offset = parseInt(offset);

      let target = (!queryObject || !queryObject.options || !queryObject.options.target) ? targetArea : queryObject.options.target;

      let promiseList = [];

      Object.keys(targetArea).forEach(el => {
        if (target[el])
          promiseList.push(this.callFunctions(el, queryObject, offset ? offset : 0));
      });

      Promise.all(promiseList)
        .then(res => {
          let result = {};

          res.forEach(el => {
            if (el.value && el.value.length > 0)
              result[el.target] = (Object.keys(result).length > 0) ? [] : el.value;
          });

          resolve(result);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  callFunctions(el, queryObject, offset) {
    let query = queryObject.phrase ? queryObject.phrase.trim() : null;
    let options = queryObject.options;
    let showAll = (options.show_all == true || options.show_all == false) ? options.show_all : null;

    switch (el) {
      case 'person': {
        return this.searchOnPerson(query, showAll, offset);
      }
        break;
      case 'business': {
        return this.searchOnBusiness(query, showAll, offset);
      }
        break;
      case 'product': {
        return this.searchOnProduct(query, showAll, offset);
      }
        break;
      case 'organization': {
        return this.searchOnOrganization(query, showAll, offset);
      }
        break;
      case 'lce': {
        return this.searchOnLCE(query, options.start_date, options.end_date, showAll, offset);
      }
        break;
      case 'event': {
        return this.searchOnEvent(query, options.start_date, options.end_date, showAll, offset);
      }
        break;
      case 'expertise': {
        return this.searchOnExpertise(query, options.is_education, showAll, offset);
      }
        break;
      case 'investment': {
        return this.searchOnInvestment(query, options.comparison_type, options.amount, options.is_lead, showAll, offset);
      }
        break;
      case 'consultancy': {
        return this.searchOnConsultancy(query, options.is_mentor, showAll, offset);
      }
        break;
      default:
        return null;
        break;
    }
  }

  searchOnPerson(phrase, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnPerson({phrase: phrase, show_all: showAll, limit: limitation, offset: offset})
        .then(res => resolve({target: 'person', value: res}))
        .catch(reject);
    });
  }

  searchOnBusiness(phrase, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnBusiness({phrase: phrase, show_all: showAll, limit: limitation, offset: offset})
        .then(res => resolve({target: 'business', value: res}))
        .catch(reject);
    })
  }

  searchOnProduct(phrase, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnProduct({phrase: phrase, show_all: showAll, limit: limitation, offset: offset})
        .then(res => resolve({target: 'product', value: res}))
        .catch(reject);
    })
  }

  searchOnOrganization(phrase, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnOrganization({phrase: phrase, show_all: showAll, limit: limitation, offset: offset})
        .then(res => resolve({target: 'organization', value: res}))
        .catch(reject);
    })
  }

  searchOnLCE(phrase, start_date, end_date, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnLCE({
        phrase: phrase,
        start_date: start_date,
        end_date: end_date,
        show_all: showAll,
        limit: limitation,
        offset: offset
      })
        .then(res => resolve({target: 'lce', value: res}))
        .catch(reject);
    })
  }

  searchOnEvent(phrase, start_date, end_date, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnEvent({
        phrase: phrase,
        start_date: start_date,
        end_date: end_date,
        show_all: showAll,
        limit: limitation,
        offset: offset
      })
        .then(res => resolve({target: 'event', value: res}))
        .catch(reject);
    })
  }

  searchOnExpertise(phrase, isEducation, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnExpertise({
        phrase: phrase,
        is_education: isEducation,
        show_all: showAll,
        limit: limitation,
        offset: offset
      })
        .then(res => resolve({target: 'expertise', value: res}))
        .catch(reject);
    })
  }

  searchOnInvestment(phrase, comparisonType, amount, is_lead, showAll, offset) {
    return new Promise((resolve, reject) => {
      if (!comparisonType) {
        comparisonType = {};
        comparisonType.lt = false;
        comparisonType.gt = false;
        comparisonType.lte = false;
        comparisonType.gte = false;
        comparisonType.eq = true;
      }
      else {
        comparisonType.lt = (!comparisonType.lt) ? null : comparisonType.lt;
        comparisonType.gt = (!comparisonType.gt) ? null : comparisonType.gt;
        comparisonType.lte = (!comparisonType.lte) ? null : comparisonType.lte;
        comparisonType.gte = (!comparisonType.gte) ? null : comparisonType.gte;
        comparisonType.eq = (!comparisonType.eq) ? null : comparisonType.eq;
      }

      this.sqlTable.searchOnInvestment({
        phrase: phrase,
        amount: amount,
        is_lead: is_lead,
        show_all: showAll,
        amount_lt: comparisonType.lt,
        amount_gt: comparisonType.gt,
        amount_lte: comparisonType.lte,
        amount_gte: comparisonType.gte,
        amount_eq: comparisonType.eq,
        limit: limitation,
        offset: offset
      })
        .then(res => resolve({target: 'investment', value: res}))
        .catch(reject);
    })
  }

  searchOnConsultancy(phrase, is_mentor, showAll, offset) {
    return new Promise((resolve, reject) => {
      this.sqlTable.searchOnConsultancy({
        phrase: phrase,
        is_mentor: is_mentor,
        show_all: showAll,
        limit: limitation,
        offset: offset
      })
        .then(res => resolve({target: 'consultancy', value: res}))
        .catch(reject);
    })
  }
}

SearchSystem.test = false;
module.exports = SearchSystem;