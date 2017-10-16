/**
 * Created by Amin on 04/02/2017.
 */
const SqlTable = require('../../lib/sqlTable.model');
const sql  = require('../../sql');

describe('SqlTable abstract class',()=>{
  let instance;
  let spies = {};
  beforeAll(done=>{
    instance = new SqlTable('users','uid',true);
    ['get','add','update'].forEach(e=>spies[e]=spyOn(instance.sql.users,e));
    done();
  });
  it("should throw error without table name",()=>{
    let test = ()=>new SqlTable();
    expect(test).toThrowError(TypeError,'Missing tableName in SqlTable class');
  });

  it("should throw error without ID member",()=>{
    let test = ()=>new SqlTable('test');
    expect(test).toThrowError(TypeError,'Missing idMember in SqlTable class');
  });

  it("should throw error on 'importData'",()=>{
    let test = ()=>instance.importData();
    expect(test).toThrowError(TypeError,"importData is not implemented");
  });


  it("should throw error on 'exportData'",()=>{
    let test = ()=>instance.exportData();
    expect(test).toThrowError(TypeError,"exportData is not implemented");
  });

  it("should call sql.users.get on load",()=>{
    instance.load({x:'y'}).then(()=>{}).catch(()=>{});
    expect(instance.sql.users.get).toHaveBeenCalledWith({x:'y'});
  });

  it("should call exportData and sql.users.add on save where uid is not defined",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>new Promise(resolve=>resolve({name:'amin'})));
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({uid:'xyz'})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve(11)));
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.users.add).toHaveBeenCalledWith({name:'amin'});
        expect(instance.uid).toBe('xyz');
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
        });
  });
  it("should call exportData and sql.users.add on save and work with plain object instead of promise",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>{return {name:'amin'}});
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({uid:10})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve({uid:11})));
    delete instance.uid;
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.users.add).toHaveBeenCalledWith({name:'amin'});
        expect(instance.uid).toBe(10);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });
  it("should call sql.users.update on save and work with plain object instead of promise",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>{return {name:'amin'}});
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({uid:10})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve({uid:11})));
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.users.update).toHaveBeenCalledWith({name:'amin'},10);
        expect(instance.uid).toBe(10);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });
  it("should call importData on load",done=>{
    spies.get.and.callFake(()=>new Promise(resolve=>resolve([{uid:1,name:'amin'}])));
    spies.importData = spyOn(instance,'importData');
    instance.load()
      .then(()=>{
        expect(instance.importData).toHaveBeenCalledWith({uid:1,name:'amin'});
        done();
      })
      .catch(err=>{fail(err.message);done()});
  });
  it("should fail on load where more than one recored is returned",done=>{
    spies.get.and.callFake(()=>new Promise(resolve=>resolve([{uid:1,name:'amin'},{uid:2,name:'Ali'}])));
    instance.load({test:1})
      .then(()=>{
        fail('succeeded!');
        done();
      })
      .catch(err=>{
        expect(err.message).toContain('Not unique record');
        done();
      })
  });

  afterAll(done=>{
    done();
  });
});