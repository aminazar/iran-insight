/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'tag';
let idMember = 'tid';

let cols = [
  'tid',
  'name',
  'proposer',
];


let types = {

  BIZ: 'business',
  ORG: 'organization',
  PROD: 'product'

};

class Tag extends SqlTable {
  constructor(test = Tag.test) {
    super(tableName, idMember, test, cols);
  }

  addAll(body) {
    return body.tags.map(tag => () => this.sql.tag.add(tag)).reduce((x, y) => x.then(y), Promise.resolve());
  }

  confirm(tagId) {

    return this.sql.tag.update({proposer: {"business": [], "organization": [], "product": []}}, tagId);
  }

  checkAccess(body, user_pid, type) {
    if (type === types.BIZ)
      return this.getUserAccess(user_pid, body.bid, null);
    else if (type === types.ORG)
      return this.getUserAccess(user_pid, null, body.oid);
    else if (type === types.PROD)
      return new Promise((resolve, reject) => {
        this.sql.administrators.get({pid: user_pid}).then(res => {
          if (res.length > 0)
            resolve({isAdmin: true});
          else
            resolve({isAdmin: false});

        }).catch(err => reject(err));

      });
  };

  /**
   *
   * @param user_pid
   * @param body => body contains oid, bid, product_id.
   * only, biz rep must access to set tag both for biz or biz's product
   */
  setTag(user_pid, body) {

    let exec = (type) => {
      let access, condition, proposer_id;

      return this.checkAccess(body, user_pid, type)
        .then(res => {
          access = res;
          if (!access.isRep && !access.isAdmin)
            return Promise.reject(error.notAllowed);

          if (type === types.BIZ) {
            proposer_id = body.bid;
            condition = `bid = ${proposer_id}`;
          }
          else if (type === types.ORG) {
            proposer_id = body.oid;
            condition = `oid = ${proposer_id}`;
          }
          else if (type === types.PROD) {

            proposer_id = body.product_id;
            condition = `product_id = ${proposer_id}`;
          }
          return this.sql.tag.appendTag({tableName: type, tag: body.name, condition})
        }).then(res => {

          return this.sql.tag.add({name: body.name});
        }).then(res => {
          if (!access.isAdmin)
            return this.sql.tag.updateProposer({proposerType: type, newProposer: `[${proposer_id}]`, tid: res.tid});
          else
            return Promise.resolve();

        });

    };

    if (body.oid) {
      return exec(types.ORG);
    } else if (body.bid) {
      return exec(types.BIZ);
    } else if (body.product_id) {
      return exec(types.PROD);
    }
    else {
      return Promise.reject(error.noId);
    }

  }

  /**
   * remove tag from business, organization or product
   * @param user_pid
   * @param body
   */
  removeTagFromTarget(user_pid, body) {

    let exec = (type) => {
      let access, condition, proposer_id;

      return this.checkAccess(body, user_pid, type)
        .then(res => {
          access = res;
          if (!access.isRep && !access.isAdmin)
            return Promise.reject(error.notAllowed);

          if (type === types.BIZ) {
            proposer_id = body.bid;
            condition = `bid = ${proposer_id}`;
          }
          else if (type === types.ORG) {
            proposer_id = body.oid;
            condition = `oid = ${proposer_id}`;
          }
          else if (type === types.PROD) {
            proposer_id = body.product_id;
            condition = `product_id = ${proposer_id}`;
          }
          return this.sql.tag.removeTagFromTarget({tableName: type, tag: body.name, condition})
        });

    };

    if (body.oid) {
      return exec(types.ORG);
    } else if (body.bid) {
      return exec(types.BIZ);
    } else if (body.product_id) {
      return exec(types.PROD);
    }
    else {
      return Promise.reject(error.noId);
    }


  }

  getTags(user_id, type, id) {

    if (!user_id)
      return Promise.reject(error.notAllowed);
    if(!id)
      return Promise.reject(error.noId);

    let condition;
    if (type === types.BIZ)
      condition = `bid = ${id}`;
    else if (type === types.ORG)
      condition = `oid = ${id}`;
    else if (type === types.BIZ)
      condition = `product_id = ${id}`;
    else
      return Promise.reject(error.illegalTypeName);

    return this.sql.tag.getActiveTags({tableName: type, condition});

  }


}

Tag.test = false;
module.exports = Tag;