/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const socket = require('../socket');
const randomString = require('randomstring');

let tableName = 'person';
let personActivationLinkTable = 'person_activation_link';
let membershipTable = 'membership';
let idColumn  = 'pid';
let personColumns = [
  'pid',
  'firstname_en',
  'firstname_fa',
  'surname_en',
  'surname_fa',
  'username',
  'secret',
  'image',
  'address_en',
  'address_fa',
  'phone_no',
  'mobile_no',
  'birth_date',
  'is_user',
  'display_name_en',
  'display_name_fa'
];

class Person extends SqlTable{
  constructor(test=Person.test){
    Person.test = test;
    super(tableName, idColumn, test, personColumns);
  }

  load(username,password){
    this.password = password;
    this.username = username.toLowerCase();
    return super.load({username:this.username});
  }

  getDataToExport(password = null){
    let exprt = {};

    personColumns.forEach(el => {
      if(el === 'secret' && password !== null)
        exprt[el] = password;
      else if(el === 'username' && this[el])
        exprt[el] = this[el].toLowerCase();
      else if(this[el] !== null && this[el] !== undefined){
        exprt[el] = this[el];
      }
    });

    return exprt;
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
      if(!this.password){
        if(!this.username)
          reject(error.emptyUsername);
        else
          resolve(this.getDataToExport());
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

              resolve(this.getDataToExport(hash));
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
          Person.setNamespace(username);
          resolve();
        }).catch(err=>reject(error.badPass)))
        .catch(err=>reject(error.noUser));
    })
  }

  insert(data){
    this.importData(data);
    this.password = data.password;
    return this.save();
  }

  update(pid, data){
    this.importData(data);
    this.pid = pid;
    if(data.password)
      this.password = data.password;
    return this.save();
  }

  completeAuth(link, data){
    return new Promise((resolve, reject) => {
      let pid = null;

      this.sql[personActivationLinkTable].getByLink({link: link})
        .then(res => {
          if(res.length === 0)
            reject(error.expiredLink);
          else {
            data.is_user = true;
            return this.update(res[0].pid, data);
          }
        })
        .then(res => {
          pid = res;
          return this.sql[personActivationLinkTable].deleteByLink({link: link});
        })
        .then(res => resolve(pid))
        .catch(err => reject(err));
    });
  }

  setProfile(dest_user, current_user, current_id, data){
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let isRep = false;
      let isAdmin = false;
      Promise.resolve()
        .then(() => {
          //Check accessibility
          if(dest_user.toLowerCase() !== current_user.toLowerCase()){
            return curSql[membershipTable].isRepresentativeOrAdmin({username: current_user, pid: current_id});
          }
          else
            return Promise.resolve();
        })
        .then(res => {
          if(dest_user.toLowerCase() === current_user.toLowerCase())
            return Promise.resolve();
          else if(res.length < 1)
            return Promise.reject(error.notAllowed);
          else{
            isRep = !(current_user.toLowerCase() === 'admin');
            isAdmin = !isRep;
            console.log('===>isRep:', isRep);
            console.log('===>isAdmin:', isAdmin);
            return Promise.resolve();
          }
        })
        .then(() => {
          if(isRep){
            if(data.pid)
              return Promise.reject(error.modifyNotAllowed);

            personColumns.forEach(el => {
              if(el !== 'username' && el !== 'display_name_en' && el !== 'display_name_fa')
                delete data[el];
            });
            data.is_user = false;

            return this.saveData(data);
          }
          else{
            //Should add user if current user is admin
            if(!data.pid && isAdmin){
              data.is_user = false;
              data.password = null;
              return this.saveData(data);
            }
            else if(!data.pid && !isAdmin)
              return Promise.reject(error.noId);
            else{
              //Ignore username and is_user to change
              delete data.is_user;
              data.username = current_user;

              return this.saveData(data, data.pid);
            }
          }
        })
        .then(() => {
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  setExpertise(){

  }

  static serialize(person, done) {
    done(null, person);
  };

  static deserialize(person, done) {
    let personInstance = new Person();
    personInstance.username = person.username;
    personInstance.password = person.password;

    personInstance.loginCheck()
      .then(() => done(null, person))
      .catch(err => {
        console.log(err.message);
        done(err);
      });
  };

  static passportLocalStrategy(req, username, password, done){
    let person = new Person(helpers.isTestReq(req));
    person.loginCheck(username, password)
      .then(()=>done(null,person))
      .catch(err=>done(err,false));
  }

  //Detect given phrase is in persian or english
  static detectLanguage(phrase){
    if(phrase && phrase.charCodeAt(0) >= 141 && phrase.charCodeAt(0) <= 254)
      return 'fa';
    else
      return 'en';
  }

  static passportOAuthStrategy(req, token, refreshToken, profile, done){
    let person = new Person(helpers.isTestReq(req));

    let displayName = {fa: null, en: null};
    if(profile.displayName){
      displayName.en = Person.detectLanguage(profile.displayName) === 'en' ? profile.displayName : null;
      displayName.fa = Person.detectLanguage(profile.displayName) === 'fa' ? profile.displayName : null;
    }
    else{
      displayName.en = Person.detectLanguage(profile.name.givenName) === 'en' ? profile.name.givenName + ' ' + profile.name.familyName : null;
      displayName.fa = Person.detectLanguage(profile.name.givenName) === 'fa' ? profile.name.givenName + ' ' + profile.name.familyName : null;
    }

    let data = {
      username: profile.emails[0].value,
      password: null,
      firstname_en: Person.detectLanguage(profile.name.givenName) === 'en' ? profile.name.givenName : null,
      firstname_fa: Person.detectLanguage(profile.name.givenName) === 'fa' ? profile.name.givenName : null,
      surname_en: Person.detectLanguage(profile.name.familyName) === 'en' ? profile.name.familyName : null,
      surname_fa: Person.detectLanguage(profile.name.familyName) === 'fa' ? profile.name.familyName : null,
      display_name_en: displayName.en,
      display_name_fa: displayName.fa,
      is_user: true
    };

    let curSql = Person.test ? sql.test : sql;

    curSql[tableName].get({username: data.username})
      .then(res => {
        if(res && res.length > 0)
          person.update(res[0].pid, data)
            .then(res => done(null, person))
            .catch(err => done(err, null));
        else
          person.insert(data)
            .then(res => done(null, person))
            .catch(err => done(err, null));
      })
      .catch(err => {
        console.log(err);
        done(err, null);
      });
  }

  static afterLogin(username) {
    return new Promise((resolve, reject) => {
      Person.setNamespace(username);
      resolve({username:username,userType:username==='admin'?'admin':'user'});
    })
  }

  static setNamespace(username) {
    socket.storeNamespace((username==='admin'?'admin':'user') + '/' + username);
  }

  static checkMailCorrectness(mail){
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(mail);
  }

  static generateActivationLink(person_id){
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let rndStr = '';

      curSql[personActivationLinkTable].select()
        .then(res => {
          let dt = res ? res.map(el => el.link) : [];

          do{
            rndStr = randomString.generate({
              length: 80,
              charset: 'alphanumeric'
            });
          }
          while(dt.includes(rndStr));

          return curSql[personActivationLinkTable].add({
            pid: person_id,
            link: rndStr
          });
        })
        .then(res => resolve(rndStr))
        .catch(err => {
          reject(err);
        })
    })
  }

  static sendActivationMail(email, person_id, display_name){
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let displayName = display_name;
      let pid = null;
      Promise.resolve()
        .then(() => {
          if(person_id){
            pid = person_id;
            return Promise.resolve();
          }
          else
            return curSql[tableName].get({username: email});
        })
        .then(res => {
          if(res){
            displayName = (res[0].display_name_en) ? res[0].display_name_en : res[0].display_name_fa;
            pid = parseInt(res[0].pid);
          }
          return Person.generateActivationLink(pid);
        })
        .then(res => {
          let mailContent = Person.composeActivationMail(displayName, res);
          return helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, 'Activation Iran-Insight Account', email);
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static registration(body){
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      let pid = null;

      if(!body.email || body.email === '')
        reject(error.emptyEmail);
      else if(!body.display_name || body.display_name === '')
        reject(error.emptyName);
      else if(!Person.checkMailCorrectness(body.email))
        reject(error.emailIsIncorrect);
      else{
        curSql[tableName].get({username: body.email})
          .then(res => {
            if(res && res.length > 0)
              return Promise.reject(error.emailExist);
            else
              return curSql[tableName].add({
                username: body.email,
                display_name_en: Person.detectLanguage(body.display_name) === 'en' ? body.display_name : null,
                display_name_fa: Person.detectLanguage(body.display_name) === 'fa' ? body.display_name : null,
                is_user: false
              });
          })
          // .then(res => {
          //   pid = parseInt(res.pid);
          //   //Generate activation link
          //   return Person.generateActivationLink(pid);
          // })
          // .then(res => {
          //   let mailContent = Person.composeActivationMail(body.display_name, res);
          //   return helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, 'Activation Iran-Insight Account', body.email);
          // })
          .then(res => {
            pid = parseInt(res.pid);
            return Person.sendActivationMail(body.email, pid, body.display_name);
          })
          .then(res => resolve(pid))
          .catch(err => {
            console.log(err);
            reject(err);
          })
      }
    })
  }

  static composeActivationMail(name, activate_link){
    let link = 'http://iraninsight/activate/' + activate_link;

    let plainContent = 'Dear ' + name + '\n' +
                       'Thank you for registration.\n' + 'For complete your registration please click on below link:\n' +
                       '\n' + link + '\n\n' +
                       'If you did not action to registration, ignore this mail.\n' +
                       'Best regards.\nIran Insight Team';

    let htmlContent = `<p>Dear ${name}</p>
                       <p>Thank you for registration.</p>
                       <p>For complete your registration please click on below link:</p>
                       <a href="${link}">${link}</a>
                       <br/><br/>
                       <p>If you did not action to registration, ignore this mail.</p>
                       <p>Best regards.</p>
                       <p>Iran Insight Team</p>`;

    return {
      plainContent: plainContent,
      htmlContent: htmlContent
    };
  }

  static checkActiveLink(link){
    let curSql = Person.test ? sql.test : sql;

    return new Promise((resolve, reject) => {
      curSql[personActivationLinkTable].getByLink({link: link})
        .then(res => {
          if(res.length > 1)
            reject(error.duplicateLink);
          if(res.length === 1)
            resolve(res[0].pid);
          else
            reject(error.expiredLink);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static select(){
    let curSql = Person.test ? sql.test : sql;
    return curSql.person.select();
  }

  static findRepRequests(){
    let curSql = Person.test ? sql.test : sql;

    let repInfo = [];

    return new Promise((resolve, reject) => {
      curSql[tableName].getListOfRepresentationRequests()
        .then(res => {
          if(res.length === 0)
            resolve('No new representative request.');
          else if(res.length>0){
            console.log('res length ==>',res.length);
            console.log(repInfo.length);
            console.log(typeof res);
            // res.forEach( el => repInfo.person.push(el.pid) );
            res.forEach( el => {
              let tempObj = repInfo.find(i => i.person.pid === el.pid);
              if(tempObj){
                if(el.bid)
                  tempObj.business.push({
                    'bizname': el.bizname,
                    'bizname_fa':el.bizname_fa,
                    'bizceo_pid': el.bizceo_pid,
                    'bizorg_type_id': el.bizorg_type_id,
                    'bizaddress':  el.bizaddress,
                    'bizaddress_fa': el.bizaddress_fa,
                    'biztel': el.biztel,
                    'bizurl': el.bizurl,
                    'bizgeneral_stats': el.bizgeneral_stats,
                    'bizfinancial_stats': el.bizfinancial_stats
                  });

                if(el.oid)
                  tempObj.organization.push({
                    'orgname': el.orgname,
                    'orgname_fa': el.orgname_fa,
                    'orgceo_pid': el.orgceo_pid,
                    'orgorg_type_id': el.orgorg_type_id
                  });
              }
              else{
                repInfo.push({
                  person: {
                    'pid': el.pid,
                    'firstname_en': el.firstname_en ,
                    'firstname_fa': el.firstname_fa,
                    'surname_en': el.surname_en,
                    'surname_fa': el.surname_fa,
                    'username': el.username,
                    'display_name_en': el.display_name_en,
                    'display_name_fa': el.display_name_fa,
                  },
                  business: el.bid ? [{
                    'bizname': el.bizname,
                    'bizname_fa':el.bizname_fa,
                    'bizceo_pid': el.bizceo_pid,
                    'bizorg_type_id': el.bizorg_type_id,
                    'bizaddress':  el.bizaddress,
                    'bizaddress_fa': el.bizaddress_fa,
                    'biztel': el.biztel,
                    'bizurl': el.bizurl,
                    'bizgeneral_stats': el.bizgeneral_stats,
                    'bizfinancial_stats': el.bizfinancial_stats
                  }] : [],
                  organization: el.oid ? [{
                    'orgname': el.orgname,
                    'orgname_fa': el.orgname_fa,
                    'orgceo_pid': el.orgceo_pid,
                    'orgorg_type_id': el.orgorg_type_id
                  }] : []
                });
              }
            });
            console.log(JSON.stringify(repInfo,null,2));
            resolve(repInfo);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static findMemRequests(username){
    let curSql = Person.test ? sql.test : sql;

    console.log('==>', username);
    return new Promise((resolve, reject) => {
      curSql[tableName].getListOfMembershipRequests()
        .then(res => {
          if(res.length === 0)
            resolve('No new user-membership request.');
          else if(!res && res.length>0){
            console.log(res.length);
            resolve(res);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static delete(id){
    let curSql = Person.test ? sql.test : sql;
    return curSql.person.delete(id);
  }

  static socketHandler(message){
    if(message.data.toLowerCase().includes('broadcast'))
      return Person.broadCastMessageToGroup(message.data);
    else{
      return Person.sendMessageToClient(message.data, 'user/' + message.rcv);
    }
  }

  static sendMessageToClient(data, client){
    return socket.sendMessage(data, client);
  }

  static broadCastMessageToGroup(data){
    return socket.sendNewMessageToAllClient(data);
  }
}
Person.test = false;
module.exports = Person;