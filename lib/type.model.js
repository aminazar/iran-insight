/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const error = require('./errors.list');
const types = require('../sql/types');

let constrained_cols = [
  'name',
  'name_fa'
];


class Type {

  constructor() {
    this.sql = Type.test ? sql.test : sql;
  }


  suggest(user_id, name, body) {


    return new Promise((resolve, reject) => {

      if (!types.includes(name))
        reject(error.illegalTypeName);

      if (!user_id)
        reject(error.notAllowed);

      if (!body.name && !body.name_fa)
        reject(error.emptyTypeName);

      this.sql.person.isAdmin({pid: user_id})
        .then(res => {
          body.active = res.length > 0;
          body.suggested_by = user_id;

          let constraint = {};

          constrained_cols.forEach(cl => {
            if (body[cl])
              constraint[cl] = body[cl];
          });

          return this.sql[name].add(body, constraint);

        }).then(res => {
        resolve(res);
      }).catch(err => reject(err));


    });


  }


  activate(name, id, body) {

    return new Promise((resolve, reject) => {


      this.sql[name].get({id}).then(res => {

        if (res.length  === 0)
          reject(error.noType);

        if (body.active)
          return this.sql[name].update({active: true}, id);

        else
          return this.sql[name].delete(id);


      }).then(res => resolve(res))
        .catch(err => reject(err));
    });


  }
}

module.exports = Type;