/**
 * Created by Amin on 01/02/2017.
 */
const env = require("../../env");
const raw = require("../../sql/raw.sql");
const sql = require('../../sql');
const path = require('path');

describe("SQL library",()=>{
  describe("Raw SQLs",()=> {
    let testSQLElementClassName = (query, table) => it(`should consist of QueryFile objects for table '${table}' and query '${query}'`, () =>
      expect(raw[table][query].constructor.name).toBe('QueryFile')
    );
    let testDirectoryNameMatchesTableName = (query, table) => it(`should have SQL file in directory with the same name as the table '${table}' for query '${query}'`, () =>
      expect(raw[table][query].file.split(path.sep).slice(-2)[0]).toBe(table)
    );

    let testAllRawSQLsAreInWrappedSQLs = (query,table) => it(`should wrap raw SQL for table table '${table}' and query '${query}'`, () => {
        expect(sql[table][query]).toBeDefined();
        expect(sql.test[table][query]).toBeDefined();
      });

    for (let t in raw)
      for (let q in raw[t]) {
        testDirectoryNameMatchesTableName(q, t);
        testSQLElementClassName(q, t);
        testAllRawSQLsAreInWrappedSQLs(q, t);
      }
  });

  describe("wrapped SQLs",()=>{
    let testWrappedSQLToBeFunctions = (query,table)=> it(`should consist of Function objects for table '${table}' and query '${query}'`, ()=>
      expect(sql[table][query].constructor.name).toBe('Function')
    );

    for (let t in sql)
      if(t!=='test')
        for (let q in sql[t]) {
          testWrappedSQLToBeFunctions(q, t);
        }
  })
});