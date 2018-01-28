const sql = require('../sql');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const moment = require('moment');
const spreadSheetHandler = require('./spreadsheet.handler');

const tableName = 'ex_data';
const businessTable = 'business';
const businessTypeTable = 'business_type';
const productTable = 'product';
const tagTable = 'tag';
const idColumn = 'eid';
const exDataColumns = [
  'eid',
  'name',
  'market_share',
  'type',
  'category',
  'province',
];

class ExternalData extends SqlTable {
  constructor(test = false) {
    super(tableName, idColumn, test, exDataColumns);
  }

  readSpreadSheet(path) {
    let spsObj = new spreadSheetHandler();
    spsObj.readFile(path);

    let promiseList = [];

    this.db.task(t => {
      for (let counter = 0; counter < spsObj.getWorkSheetCount(); counter++) {
        spsObj.getWorksheet(counter);
        spsObj.parseWorksheet();

        spsObj.loadedValue.forEach(el => {
          promiseList.push(this.sql[tableName].add({
            name: el['نام سایت'] || el['نام سایت 2'] || el['نام سایت 3'],
            market_share: el['سهم سایت از کل ترافیک طبقه بندی'],
            type: el['بازار'],
            class: el['طبقه بندی'],
            category: spsObj.getWorksheetName(counter),
            province: el['استان'],
            hhi: el['شاخص هرفیندال هیرشمن (زمان حضور)'] ? el['شاخص هرفیندال هیرشمن (زمان حضور)'] : null,
          }, t));
        });
      }

      return Promise.all(promiseList)
        .then(res => {
          console.log('All data inserted into table');
        })
        .catch(err => {
          console.error('Cannot insert data into table. Error: ', err);
        });
    });
  }

  saveToSpreadSheet(path) {
    let spsObj = new spreadSheetHandler();

    this.sql[tableName].select()
      .then(res => {
        console.log('res ===> ', res);
        if(res.length > 0) {
          res.forEach(el => {
            delete el.eid;
            delete el.bid;
          });

          spsObj.putToWorksheet(res);
          console.log('All records save to sheet');
          spsObj.writeFile(path);
          console.log('Data are written to ' + path);
        } else
          console.log('No record');
      })
      .catch(err => {
        console.error('Cannot select all records from ex_data table, err ==>', err);
      });
  }

  getCategories() {
    return this.sql[tableName].getCat();
  }

  get(body, offset, limit) {
    return this.sql[tableName].get({
      phrase: body.phrase ? body.phrase.trim() : null,
      category: body.category ? body.category.trim() : null,
      order: (body.sort_column && body.direction) ? body.sort_column : 'eid',
      direction: (body.sort_column && body.direction) ? body.direction : 'asc',
      offset: offset ? offset : 0,
      limit: limit ? limit : 10,
    });
  }

  batchInsert(body, user_id) {
    return new Promise((resolve, reject) => {
      this.db.task(t => {
        let promiseList = [];

        body.forEach(el => promiseList.push(this.chainInsert(el, user_id, t)));

        return Promise.all(promiseList)
          .then(res => resolve(res))
          .catch(err => reject(err));
      });
    });
  }

  safeInsertTag(tags, task) {
    if (tags.length <= 0)
      return Promise.resolve();

    let promiseList = [];
    tags.forEach(el => {
      promiseList.push(
        this.sql[tagTable].add({
          name: el,
          active: true,
        }, {name: el}, task)
      );
    });

    return Promise.all(promiseList);
  }

  chainInsert(data, user_id, task) {
    let business_id = null;

    return this.sql[businessTypeTable].add({
      name: null,
      name_fa: data.category,
      suggested_by: user_id,
      active: true,
    }, {name_fa: data.category}, task)
      .then(res => {
        let tags = [];
        if (data.type)
          tags.push(data.type);
        if (data.class)
          tags.push(data.class);

        return this.sql[businessTable].add({
          name: data.name,
          name_fa: null,
          biz_type_id: res.id,
          address_fa: data.province,
          start_date: moment().format('YYYY-MM-DD'),
          tags: tags,
          url: 'http://' + data.name,
        }, task);
      })
      .then(res => {
        let tags = [];
        business_id = res.bid;
        if (data.class)
          tags.push(data.class);
        if (data.class && data.category && data.class.toLowerCase() !== data.category.toLowerCase())
          tags.push(data.category);

        return this.sql[productTable].add({
          business_id: res.bid,
          name: data.name,
          name_fa: null,
          description: null,
          description_fa: data.type,
          tags: tags,
        }, task);
      })
      .then(res => {
        let tags = [];
        if (data.type)
          tags.push(data.type);
        if (data.class)
          tags.push(data.class);
        if (data.class && data.category && data.class.toLowerCase() !== data.category.toLowerCase())
          tags.push(data.category);

        return this.safeInsertTag(tags, task);
      })
      .then(res => {
        return this.sql[tableName].update({
          bid: business_id,
        }, data.eid, task);
      });
  }

  set(body){
    try {
      this.readSpreadSheet(body.path);
      return Promise.resolve('done');
    }
    catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = ExternalData;