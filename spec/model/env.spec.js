/**
 * Created by Amin on 31/01/2017.
 */
const env = require("../../env");
const sql = require('../../sql');

describe("Env",()=> {
  describe("Database", ()=>{
    it("should have 'db' key", ()=>{
      expect(env.db).toBeDefined();
    });
    it("should have 'Database' as type",()=>{
      expect(env.db.constructor.name).toBe('Database');
    });
    it("should connect",done=>{
      sql.db.test({columnName:'col'}).then(res=>{expect(res.col).toBe(1);done()}).catch(err=>{fail(err.message);done()});
    });
  });
  describe("Test Database", ()=>{
    it("should have 'testDb' key", ()=>{
      expect(env.testDb).toBeDefined();
    });
    it("should have 'Database' as type",()=>{
      expect(env.testDb.constructor.name).toBe('Database');
    });
    it("should connect",done=>{
      sql.test.db.test({columnName:'col'}).then(res=>{expect(res.col).toBe(1);done()}).catch(err=>{fail(err.message);done()});
    });
  });

  describe("Config",()=>{
    it("should have 'pgConnection' key",()=>{
      expect(env.config.pgConnection).toBeDefined();
      expect(env.config.database).toBeDefined();
    })
  });
});