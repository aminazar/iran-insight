/**
 * Created by Amin on 04/02/2017.
 */
const sql = require('../sql/index');

/* Abstrac class
 * to implement 'load' and 'save' methods
 * that are shared between real classes
 * that relies on 'importData' and 'exportData' in those classes
 */
class SqlTable {
  constructor(tableName, idMember, test = false, columns = []) {
    if (!tableName)
      throw new TypeError('Missing tableName in SqlTable class');

    if (!idMember)
      throw new TypeError('Missing idMember in SqlTable class');

    this.tableName = tableName;
    this.idMember = idMember;

    this.sql = test ? sql.test : sql;
    this.test = test;
    this.columns = columns;
    if (!this.sql[tableName])
      throw new ReferenceError(`'${tableName}' is not a defined SQL table`);
  }

  load(criteria) {

    return new Promise((resolve, reject) => {
      this.sql[this.tableName].get(criteria)
        .then(data => {

          if (data.length > 1)
            reject(new Error(`Not unique record with criteria: ${JSON.stringify(criteria)}`));
          else if (!data.length)
            reject(new Error(`No records with criteria: ${JSON.stringify(criteria)} in table ${this.tableName}`));
          else {
            this.importData(data[0]);
            resolve(data[0]);
          }
        })
        .catch(err => {
          reject(err.message)
        });
    });
  }

  save() {
    return new Promise((resolve, reject) => {
      let ed = this.exportData(); //Either a 'Promise' or an object with data
      let execute = this[this.idMember] ? //Updates in case the model contains an id, othewise adds data as new record
        //Update
        data => {
          this.sql[this.tableName].update(data, this[this.idMember])
            .then(ids => {
              if(ids.length === 0)
                reject(new Error(`No record was found to update in table ${this.tableName}`));
              resolve(this[this.idMember]);
            })
            .catch(reject);
        }
        :
        //Insert
        data => {
          this.sql[this.tableName].add(data)
            .then(idData => {
              let id = idData[this.idMember];
              this[this.idMember] = id;
              resolve(id);
            })
            .catch(reject);
        };

      if (ed.constructor.name === 'Promise')
        ed.then(execute).catch(reject);
      else
        execute(ed);
    });
  }

  construct(data, id) {
    if (!this.columns.length)
      throw new TypeError('construct is not implemented');
    else if (data) {
      if (id) {
        this[this.idMember] = id;
      }
      this.columns.forEach(col => {
        if (data[col] !== undefined)
          this[col] = data[col];
      });
    }
  }

  saveData(data, id) {
    return new Promise((resolve, reject) => {
      try {
        this.construct(data, id);
      } catch (e) {
        reject(e);
      }
      return this.save().then(resolve).catch(reject);
    });
  }

  select(data) {
    let cols = data ? Object.keys(data) : [];
    let nullCols = data ? Object.keys(data).filter(r => data[r] === null) : [];
    return this.sql[this.tableName].select(cols, nullCols)(data)
      .then(res => res.map(row => {
        this.importData(row);
        let exprt = {};
        this.columns.concat(this.idMember).forEach(col => {
          if (this[col] !== undefined)
            exprt[col] = this[col];
        });
        return exprt;
      }));
  }

  delete(id) {
    return this.sql[this.tableName].delete(id);
  }

  cleanData() {
    if (!this.columns.length)
      throw new TypeError('cleanData is not implemented');
    else {
      this.columns.concat(this.idMember).forEach(col => {
        delete this[col];
      });
    }
  }

  importData(data) {
    if (!this.columns.length)
      throw new TypeError('importData is not implemented');
    else {

      this.columns.concat(this.idMember).forEach(key => {
        if (data[key] !== undefined)
          this[key] = data[key];
      });

    }

  }

  exportData() {
    if (!this.columns.length)
      throw new TypeError('exportData is not implemented');
    else {
      let exprt = {};
      this.columns.forEach(key => {
        if (this[key] !== undefined)
          exprt[key] = this[key];
      });
      return exprt;
    }
  }
}

module.exports = SqlTable;