/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');

let tableName = 'person';
let idColumn  = 'pid';
let personColumns = ['pid', 'firstname', 'surename', 'username', 'secret', 'is_user', 'display_name'];

class User extends SqlTable{
  constructor(test=User.test){
    super(tableName, idColumn, test);
  }

  load(username,password){
    this.password = password;
    this.username = username.toLowerCase();
    return super.load({username:this.username});
  }

  importData(data) {
    personColumns.forEach(el => {
      if(data[el])
        this[el] = data[el];
    });

    this.is_admin = this.username && helpers.adminCheck(this.username);
  }

  exportData(){
    return new Promise((resolve, reject) => {
      let exprt = {};
      if(!this.password){
        if(!this.username)
          reject(error.emptyUsername);
        else
          resolve({username:this.username.toLowerCase()});
      }
      else {
        env.bcrypt.genSalt(101, (err, salt) => {
          if (err)
            reject(err);
          else
            env.bcrypt.hash(this.password, salt, null, (err, hash) => {
              if (err)
                reject(err);
              else
                this.secret = hash;

              personColumns.forEach(el => {
                if(el === 'secret')
                  exprt[el] = hash;
                else if(el === 'username' && this[el])
                  exprt[el] = this[el].toLowerCase();
                else if(this[el]){
                  exprt[el] = this[el];
                }
              });

              resolve(exprt);
            });
        });
      }
    });
  }

  checkPassword() {
    return new Promise((resolve, reject) => {
      if(!this.secret)
        reject(error.noPass);
      env.bcrypt.compare(this.password, this.secret, (err, res) => {
        if(err)
          reject(err);
        else if (!res)
          reject(error.badPass);
        else
          resolve();
      });
    });
  }

  loginCheck(username=this.username, password=this.password) {
    return new Promise((resolve,reject) => {
      this.load(username,password)
        .then(()=>this.checkPassword().then(() => {
          User.setNamespace(username);
          resolve();
        }).catch(err=>reject(error.badPass)))
        .catch(err=>reject(error.noUser));
    })
  }

  insert(data){
    this.username = data.username;
    this.password = data.password;
    return this.save();
  }

  update(pid, data){
    this.pid = pid;
    if(data.username)
      this.username = data.username;
    if(data.password)
      this.password = data.password;
    return this.save();
  }

  static serialize(user, done) {
    done(null, user);
  };

  static deserialize(user, done) {
    let userInstance = new User();
    userInstance.username = user.username;
    userInstance.password = user.password;

    userInstance.loginCheck()
      .then(() => done(null, user))
      .catch(err => {
        console.log(err.message);
        done(err);
      });
  };

  static passportLocalStrategy(req, username, password, done){
    let user = new User(helpers.isTestReq(req));
    user.loginCheck(username, password)
      .then(()=>done(null,user))
      .catch(err=>done(err,false));
  }

  static passportGoogleStrategy(req, token, refreshToken, profile, done){
    // let user = new User(helpers.isTestReq(req));
    done(null, {username: 'test', password: 'test'});
  }

  static afterLogin(username) {
    return new Promise((resolve, reject) => {
      User.setNamespace(username);
      resolve({username:username,userType:username==='admin'?'admin':'user'});
    })
  }

  static setNamespace(username) {
    socket.storeNamespace((username==='admin'?'admin':'user') + '/' + username);
  }

  static select(){
    let curSql = User.test ? sql.test : sql;
    return curSql.person.select();
  }

  static delete(id){
    let curSql = User.test ? sql.test : sql;
    return curSql.person.delete(id);
  }

  static socketHandler(message){
    if(message.data.toLowerCase().includes('broadcast'))
      return User.broadCastMessageToGroup(message.data);
    else{
      return User.sendMessageToClient(message.data, 'user/' + message.rcv);
    }
  }

  static sendMessageToClient(data, client){
    return socket.sendMessage(data, client);
  }

  static broadCastMessageToGroup(data){
    return socket.sendNewMessageToAllClient(data);
  }
}
User.test = false;
module.exports = User;