/**
 * Created by Amin on 01/02/2017.
 */
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

const DEFAULT_AFFINITY = 5;

class Tag extends SqlTable {
  constructor(test = Tag.test) {
    super(tableName, idMember, test, cols);
  }

  addAll(body) {
    return body.tags.map(tag => () => this.sql.tag.add(tag)).reduce((x, y) => x.then(y), Promise.resolve());
  }

  confirm(tagId) {
    return this.sql.tag.update({active: true}, tagId);
  }

  reject(tagId) {
    return this.sql.tag.update({active: false}, tagId);
  }


  /**
   * for products: check user is the rep of biz whose product is for
   * @param body
   * @param user_pid
   * @param type
   * @param task
   * @returns {*}
   */
  checkAccess(body, user_pid, type, task) {

    if (type === types.BIZ)
      return this.getUserAccess(user_pid, body.bid, null, task);
    else if (type === types.ORG)
      return this.getUserAccess(user_pid, null, body.oid, task);
    else if (type === types.PROD)
      return this.sql.product.get({product_id: body.product_id}, task).then(res => {
          return this.getUserAccess(user_pid, res[0].bid, null, task)
        }
      );
  };

  /**
   *
   * @param user_pid
   * @param body => body contains oid, bid, product_id, name and related_names (related tag names).
   * only, biz rep must access to set tag both for biz or biz's product
   */
  setTag(user_pid, body) {

    if (!body.name)
      return Promise.reject(error.noTagName);

    let exec = (type) => {
      let access, condition, proposer_id;

      return this.db.task(task => {
        return this.checkAccess(body, user_pid, type, task)
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

            let result;
            return this.sql.tag.appendTagToTarget({tableName: type, tag: body.name, condition}, task)
              .then(res => {
                return this.sql.tag.add({
                  name: body.name,
                  active: access.isAdmin ? (body.active ? body.active : false) : false
                }, {name: body.name}, task); // add is done by safe insert so id of inserted or existing tag is returned
              }).then(res => {

                result = res;

                return this.sql.tag_connection.recalculateAffiliation({
                  tableName: type,
                  condition,
                  inc: 1,
                  tid: res.tid,
                  default_affinity: DEFAULT_AFFINITY
                }, task);
              })
              .then(res => {
                return Promise.resolve(result);
              });

          });
      });
    };

    if (body.oid) {
      return exec(types.ORG);
    }
    else if (body.bid) {
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
      let condition, proposerId;

      return this.db.task(task => {

        return this.checkAccess(body, user_pid, type, task)
          .then(access => {
            if (!access.isRep && !access.isAdmin)
              return Promise.reject(error.notAllowed);

            if (type === types.BIZ) {
              proposerId = body.bid;
              condition = `bid = ${proposerId}`;
            }
            else if (type === types.ORG) {
              proposerId = body.oid;
              condition = `oid = ${proposerId}`;
            }
            else if (type === types.PROD) {
              proposerId = body.product_id;
              condition = `product_id = ${proposerId}`;
            }
            return this.sql.tag.removeTagFromTarget({tableName: type, tag: body.name, proposerId, condition}, task)
          })
          .then(res => {
            return this.sql.tag.get({name: body.name});
          })
          .then(res => {

            return this.sql.tag_connection.recalculateAffiliation({
              tableName: type,
              condition,
              inc: -1,
              tid: res[0].tid,
              default_affinity: DEFAULT_AFFINITY
            }, task);
          });

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

    return this.db.task(task => {
      if (!user_id)
        return Promise.reject(error.notAllowed);
      if (!id)
        return Promise.reject(error.noId);

      let condition;
      if (type === types.BIZ)
        condition = `bid = ${id}`;
      else if (type === types.ORG)
        condition = `oid = ${id}`;
      else if (type === types.PROD)
        condition = `product_id = ${id}`;
      else
        return Promise.reject(error.illegalTypeName);


      let access = type === types.BIZ || types.PROD ? this.getUserAccess(user_id, id, null, task) : this.getUserAccess(user_id, null, id, task);


      return access.then(res => {
        let activeCondition = '';
        if (!res.isRep && !res.isAdmin)
          activeCondition = 'and active = true';

        return this.sql.tag.getTags({tableName: type, condition, activeCondition}, task);
      });
    });

  }

  /**
   * this function is used to get list of similar tags for auto complete views
   * @param user_id
   * @param body
   * @returns {external:Promise|*|Promise<any>|void}
   */
  getList(user_id, body) {

    if (!body.name)
      return Promise.reject(error.noTagName);


    return this.db.task(task => {
      if (!user_id)
        return Promise.reject(error.notAllowed);

      return this.sql.person.isAdmin({pid: user_id}, task).then(res => {

        let activeCondition = '';
        if (res.length === 0)
          activeCondition = 'and active = true';

        return this.sql.tag.getSimilar({name: body.name, activeCondition}, task);

      });
    });

  }

  getConnection(user_id, body) {

    if (!body.name)
      return Promise.reject(error.noTagName);

    if (!user_id)
      return Promise.reject(error.notAllowed);

    return this.sql.tag_connection.getConnection({name: body.name});

  }
}

Tag.test = false;
module.exports = Tag;