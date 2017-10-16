/**
 * Created by Amin on 04/02/2017.
 */
const sql = require('../sql');

/* Abstrac class
* to implement 'load' and 'save' methods
* that are shared between real classes
* that relies on 'importData' and 'exportData' in those classes
*/
class SqlTable{
  constructor(tableName, idMember, test=false){
    if(!tableName)
      throw new TypeError('Missing tableName in SqlTable class');

    if(!idMember)
      throw new TypeError('Missing idMember in SqlTable class');

    this.tableName = tableName;
    this.idMember  = idMember;

    this.sql = test ? sql.test : sql;
    this.test = test;
    if(!this.sql[tableName])
      throw new ReferenceError(`'${tableName}' is not a defiend SQL table`);
  }

  load(criteria) {
    return new Promise((resolve, reject) => {
      this.sql[this.tableName].get(criteria)
        .then(data => {
          if(data.length>1)
            reject(new Error(`Not unique record with criteria: ${JSON.stringify(criteria)}`));
          else if(!data.length)
            reject(new Error(`No records with criteria: ${JSON.stringify(criteria)}`));
          else {
            this.importData(data[0]);
            resolve(data[0]);
          }
        })
        .catch(err=>{console.log(err);reject(err.message)});
    });
  }

  save() {
    return new Promise((resolve, reject)=>{
      let ed = this.exportData(); //Either a 'Promise' or an object with data

      let execute = this[this.idMember] ? //Updates in case the model contains an id, othewise adds data as new record
        //Update
        data => {
          this.sql[this.tableName].update(data,this[this.idMember])
            .then(()=>resolve(this[this.idMember]))
            .catch(reject);
        }
        :
        //Insert
        data => {
          this.sql[this.tableName].add(data)
            .then(idData=>{
              let id=idData[this.idMember];
              this[this.idMember]=id;
              resolve(id);
            })
            .catch(reject);
        };

      if(ed.constructor.name==='Promise')
        ed.then(execute).catch(reject);
      else
        execute(ed);
    });
  }

  importData(data){
    throw new TypeError('importData is not implemented');
  }

  exportData(){
    throw new TypeError('exportData is not implemented');
  }
};

module.exports = SqlTable;