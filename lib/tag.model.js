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

class Tag extends SqlTable {
  constructor(test = Tag.test) {
    super(tableName, idMember, test, cols);
  }

  static addAll(body) {
      return body.tags.map(tag => () => this.sql.tag.add(tag)).reduce((x,y) => x.then(y), Promise.resolve());
  }

  confirm(tagId){

    return this.sql.tag.update({proposer: null} , tagId);
  }

}

Tag.test = false;
module.exports = Tag;