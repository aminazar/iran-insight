const sql = require('../sql');
const error = require('./errors.list');
const helpers = require('./helpers');
const env = require('../env');

let targetArea = {
  person: true,
  business: true,
  product: true,
  organization: true,
  // lce: true,
  event: true,
  expertise: true,
  investment: true,
  consultancy: true,
  type: true,
  tag: false,
};
let limitation = 10;
let searchDir = 'search';

class SearchSystem {
  constructor(test = SearchSystem.test) {
    this.sqlTable = test ? sql.test : sql;
    this.searchSqlTable = this.sqlTable[searchDir];
    this.db = test ? env.testDb : env.db;
  }

  suggest(body) {
    let table = body.table;
    let phrase = body.phrase;
    let id = body.id;
    let idColumn = body.idColumn;
    let fieldName = body.fieldName;
    let otherFieldName = body.otherFieldName;
    let dscpFieldName = body.dscpFieldName;
    let dscpFieldNameFa = body.dscpFieldNameFa;
    let ids = body.currentIds ? body.currentIds : [];

    if(!table)
      return Promise.reject(error.noTable);

    if(!idColumn)
      return Promise.reject(error.noIdColumn);

    if(!fieldName)
      return Promise.reject(error.noFieldName);

    let selectClause = idColumn.toString();
    [fieldName, otherFieldName, dscpFieldName, dscpFieldNameFa].forEach(el => {
      if(el)
        selectClause += ', ' + el;
    });

    return this.sqlTable.suggest.suggestion({
      select_clause: selectClause,
      field_name: fieldName,
      table_name: table,
      id_column: idColumn,
      phrase: phrase,
      ids: ids.length > 0 ? ids.join(',') : -1,
    });
  }

  search(queryObject, offset, pageSize) {
    return new Promise((resolve, reject) => {
      offset = parseInt(offset);
      pageSize = parseInt(pageSize);

      let target = (!queryObject || !queryObject.options || !queryObject.options.target) ? targetArea : queryObject.options.target;

      let promiseList = [];

      Object.keys(targetArea).forEach(el => {
        if (target[el])
          promiseList.push(this.callFunctions(el, queryObject, offset ? offset : 0, pageSize ? pageSize : null));
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

  callFunctions(el, queryObject, offset, pageSize) {
    let query = queryObject.phrase ? queryObject.phrase.trim() : null;
    let options = queryObject.options;
    let showAll = (options.show_all !== null && options.show_all !== undefined) ? options.show_all : null;

    switch (el) {
      case 'person': {
        return this.searchOnPerson(query, showAll, offset, pageSize);
      }
        break;
      case 'business': {
        return this.searchOnBusiness(query, showAll, offset, pageSize);
      }
        break;
      case 'product': {
        return this.searchOnProduct(query, showAll, offset, pageSize);
      }
        break;
      case 'organization': {
        return this.searchOnOrganization(query, showAll, offset, pageSize);
      }
        break;
      case 'lce': {
        return this.searchOnLCE(query, options.start_date, options.end_date, showAll, offset, pageSize);
      }
        break;
      case 'event': {
        return this.searchOnEvent(query, options.start_date, options.end_date, showAll, offset, pageSize);
      }
        break;
      case 'expertise': {
        return this.searchOnExpertise(query, options.is_education, showAll, offset, pageSize);
      }
        break;
      case 'investment': {
        return this.searchOnInvestment(query, options.comparison_type, options.amount, options.is_lead, showAll, offset, pageSize);
      }
        break;
      case 'consultancy': {
        return this.searchOnConsultancy(query, options.is_mentor, showAll, offset, pageSize);
      }
        break;
      case 'type': {
        return this.searchOnType(query, options.is_active, showAll, offset, pageSize);
      }
      case 'tag': {
        return this.searchOnTags(query, options.is_active, showAll, offset, pageSize);
      }
      default:
        return null;
        break;
    }
  }

  searchOnPerson(phrase, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnPerson({
        phrase: phrase,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'person', value: res}))
        .catch(reject);
    });
  }

  searchOnBusiness(phrase, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnBusiness({
        phrase: phrase,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'business', value: res}))
        .catch(reject);
    })
  }

  searchOnProduct(phrase, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnProduct({
        phrase: phrase,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'product', value: res}))
        .catch(reject);
    })
  }

  searchOnOrganization(phrase, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnOrganization({
        phrase: phrase,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'organization', value: res}))
        .catch(reject);
    })
  }

  searchOnLCE(phrase, start_date, end_date, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnLCE({
        phrase: phrase,
        start_date: start_date,
        end_date: end_date,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'lce', value: res}))
        .catch(reject);
    })
  }

  searchOnEvent(phrase, start_date, end_date, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnEvent({
        phrase: phrase,
        start_date: start_date,
        end_date: end_date,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'event', value: res}))
        .catch(reject);
    })
  }

  searchOnExpertise(phrase, isEducation, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnExpertise({
        phrase: phrase,
        is_education: isEducation,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'expertise', value: res}))
        .catch(reject);
    })
  }

  searchOnInvestment(phrase, comparisonType, amount, is_lead, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      if (!comparisonType) {
        comparisonType = {};
        comparisonType.lt = false;
        comparisonType.gt = false;
        comparisonType.eq = true;
      }
      else {
        comparisonType.lt = (!comparisonType.lt) ? null : comparisonType.lt;
        comparisonType.gt = (!comparisonType.gt) ? null : comparisonType.gt;
        comparisonType.eq = (!comparisonType.eq) ? null : comparisonType.eq;
      }

      this.searchSqlTable.searchOnInvestment({
        phrase: phrase,
        amount: amount,
        is_lead: is_lead,
        show_all: showAll,
        amount_lt: comparisonType.lt,
        amount_gt: comparisonType.gt,
        amount_lte: comparisonType.lte,
        amount_gte: comparisonType.gte,
        amount_eq: comparisonType.eq,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'investment', value: res}))
        .catch(reject);
    })
  }

  searchOnConsultancy(phrase, is_mentor, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnConsultancy({
        phrase: phrase,
        is_mentor: is_mentor,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'consultancy', value: res}))
        .catch(reject);
    })
  }

  searchOnType(phrase, isActive, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnType({
        phrase: phrase,
        is_active: isActive,
        show_all: showAll,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'type', value: res}))
        .catch(reject);
    });
  }

  searchOnTags(phrase, isActive, showAll, offset, pageSize) {
    return new Promise((resolve, reject) => {
      this.searchSqlTable.searchOnTags({
        phrase: phrase,
        show_all: showAll,
        is_active: isActive,
        limit: pageSize ? pageSize : limitation,
        offset: offset
      })
        .then(res => resolve({target: 'tag', value: res}))
        .catch(reject);
    });
  }
}

SearchSystem.test = false;
module.exports = SearchSystem;