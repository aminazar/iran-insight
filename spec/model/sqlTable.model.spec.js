/**
 * Created by Amin on 04/02/2017.
 */
const SqlTable = require('../../lib/sqlTable.model');
const sql  = require('../../sql');

describe('SqlTable abstract class',()=>{
  let instance;
  let spies = {};
  beforeAll(done=>{
    instance = new SqlTable('person','pid',true);
    ['get','add','update'].forEach(e=>spies[e]=spyOn(instance.sql.person,e));
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

  it("should call sql.person.get on load",()=>{
    instance.load({x:'y'}).then(()=>{}).catch(()=>{});
    expect(instance.sql.person.get).toHaveBeenCalledWith({x:'y'});
  });

  it("should call exportData and sql.person.add on save where pid is not defined",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>new Promise(resolve=>resolve({username:'amin'})));
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({pid:'xyz'})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve(11)));
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.person.add).toHaveBeenCalledWith({username:'amin'});
        expect(instance.pid).toBe('xyz');
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
        });
  });
  it("should call exportData and sql.person.add on save and work with plain object instead of promise",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>{return {username:'amin'}});
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({pid:10})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve({pid:11})));
    delete instance.pid;
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.person.add).toHaveBeenCalledWith({username:'amin'});
        expect(instance.pid).toBe(10);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });
  it("should call sql.person.update on save and work with plain object instead of promise",done=>{
    spies.exportData = spyOn(instance,'exportData');
    spies.exportData.and.callFake(()=>{return {username :'amin'}});
    spies.add.and.callFake(data=>new Promise(resolve=>resolve({pid:10})));
    spies.update.and.callFake(data=>new Promise(resolve=>resolve({pid:11})));
    instance.save()
      .then(()=>{
        expect(instance.exportData).toHaveBeenCalled();
        expect(instance.sql.person.update).toHaveBeenCalledWith({username:'amin'},10);
        expect(instance.pid).toBe(10);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });
  it("should call importData on load",done=>{
    spies.get.and.callFake(()=>new Promise(resolve=>resolve([{pid:1,username:'amin'}])));
    spies.importData = spyOn(instance,'importData');
    instance.load()
      .then(()=>{
        expect(instance.importData).toHaveBeenCalledWith({pid:1,username:'amin'});
        done();
      })
      .catch(err=>{fail(err.message);done()});
  });
  it("should fail on load where more than one recored is returned",done=>{
    spies.get.and.callFake(()=>new Promise(resolve=>resolve([{pid:1,username:'amin'},{pid:2,username:'Ali'}])));
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