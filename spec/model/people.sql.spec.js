/**
 * Created by Amin on 01/02/2017.
 */
const env = require("../../env");
const sql = require('../../sql');

describe("Test 'person' table",()=>{
  let pid;
  beforeAll(done=>{
      sql.test.person.create()
        .then(() => {
          done();
        })
        .catch(err => {
          console.log(err.message);
          done();
        });
  });

  it("should add a row to table", done=>{
    sql.test.person.add({username:'a@a.com', secret: '123'})
      .then(res=>{
        expect(typeof res.pid).toBe('number');
        pid = res.pid;
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });

  it("should get the row in table", done=>{
    if(pid){
      sql.test.person.get({username:'a@a.com'})
        .then(res=>{
          expect(res[0].pid).toBe(pid);
          done();
        })
        .catch(err=>{
          fail(err.message);
          done();
        });
    }
  });

  it("should update a row in table", done=>{
    if(pid){
      sql.test.person.update({username:'hadi_0'}, pid)
        .then(res=> {
          expect(res).toBeTruthy();
          done()
        })
        .catch(err=>{
          fail(err.message);
          done();
        })
      }
  });

  it("should get the row in table", done=>{
    if(pid){
      sql.test.person.get({username:'hadi_0'})
        .then(res=>{
          expect(res[0].pid).toBe(pid);
          done();
        })
        .catch(err=>{
          fail(err.message);
          done();
        });
    }
  });

  afterAll((done)=>{
    if(pid)
      sql.test.person.drop().then(res=>done()).catch(err=>{console.log(err.message);done()});
    else done();
  });
});