/**
 * Created by Amin on 01/02/2017.
 */
const env = require("../../env");
const sql = require('../../sql');
const lib = require('../../lib');

describe("Test 'business' table",()=>{
  let bid;
  beforeAll(done=>{
    lib.dbHelpers.create()
      .then(() => {
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it("should add a row to table", done=>{
    sql.test.business.add({name:'burgista app', name_fa: 'برگیستا'})
      .then(res=>{
        expect(typeof res.bid).toBe('number');
        console.log('****',res.bid);
        bid = res.bid;
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });

  afterAll((done)=>{
    if(bid)
      sql.test.business.drop().then(res=>done()).catch(err=>{console.log(err.message);done()});
    else done();
  });
});