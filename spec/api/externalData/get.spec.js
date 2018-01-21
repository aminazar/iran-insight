const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');
const Err = require('../../../lib/errors.list');
const exData = require('../../../lib/externalData.model');

describe("GET External Data API", () => {
  let normalUserJar = null;
  let adminJar = null;

  let exDataList = [
    {name: 'data1', market_share: 12.3, type: 'type 1', class: 'class 10', category: 'cat6', hhi: 22888.66},
    {name: 'data2', market_share: 12.7, type: 'type 2', class: 'class 13', category: 'cat6', hhi: 26014.46},
    {name: 'data3', market_share: 6.3, type: 'type 3', class: 'class 12', category: 'cat5', hhi: 1575.2661},
    {name: 'data4', market_share: 42.8, type: 'type 4', class: 'class 3', category: 'cat6', hhi: 3355637.785},
    {name: 'data5', market_share: 2.4, type: 'type 5', class: 'class 1', category: 'cat5', hhi: 33.1776},
    {name: 'data6', market_share: 9.2, type: 'type 6', class: 'class 10', category: 'cat6', hhi: 7163.92},
    {name: 'data7', market_share: 36, type: 'type 7', class: 'class 16', category: 'cat5', hhi: 1679616},
  ];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', '123', {display_name_en: 'Admin'}))
      .then(res => {
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(() => lib.dbHelpers.addAndLoginPerson('aa', '123', {display_name_en: 'aa'}))
      .then(res => {
        normalUserJar = res.rpJar;
        let promiseList = [];
        exDataList.forEach(el => sql.test.ex_data.add(el));
        return Promise.all(promiseList);
      })
      .then(res => {
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("admin should be able to get list of external data categories", function (done) {
    this.done = done;
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('exdata/cat'),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        expect(data.map(el => el.category)).toContain('cat5');
        expect(data.map(el => el.category)).toContain('cat6');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("other user cannot get list of external data categories", function (done) {
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('exdata/cat'),
      jar: normalUserJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Normal user can get list of categories');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(Err.adminOnly.status);
        expect(err.error).toBe(Err.adminOnly.message);
        done();
      });
  });
});