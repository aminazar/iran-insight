/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const error = require('./errors.list');
const types = require('../sql/types');
const env = require('../env');

let constrained_cols = [
  'name',
  'name_fa'
];


class Type {

  constructor() {
    this.sql = Type.test ? sql.test : sql;
    this.db = Type.test ? env.testDb : env.db;

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
          body.active = res.length > 0 && body.active; // only admin can use active in body
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


  update(name, id, body) {

    return new Promise((resolve, reject) => {

      if (!types.includes(name))
        reject(error.illegalTypeName);


      this.sql[name].get({id}).then(res => {

        if (res.length === 0)
          reject(error.noType);

        let type = {
          active: body.active,
          name: body.name,
          name_fa: body.name_fa,
        };

        if (body.hasOwnProperty('is_killer'))
          type.is_killer = body.is_killer;

        return this.sql[name].update(type, id);
      }).then(res => {
        resolve({id})
      })
        .catch(err => reject(err));
    });


  }

  delete(name, id) {

    return this.db.task(task => {

      return this.sql[`${name}_type`].get({id}, task)
        .then(res => {

          if (res.length === 0)
            return Promise.reject(error.noType);

          return this.sql[`${name}_type`].delete(id, task);
        })


    })

  }


  static getTypes() {

    return types.map(t => t.replace('_type', ''));
  }

  getInfo(name, id) {

    return this.sql[name].getInfo({tableName: name, id});
  }

}

module.exports = Type;