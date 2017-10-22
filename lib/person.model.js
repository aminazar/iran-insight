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
let idColumn  = 'pid';
let personColumns = ['pid', 'firstname_en', 'firstname_fa', 'surname_en', 'surname_fa', 'username', 'secret', 'is_user', 'display_name_en', 'display_name_fa'];

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
      else if(this[el]){
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
            reject('Link is expired');
          else {
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
                display_name_fa: Person.detectLanguage(body.display_name) === 'fa' ? body.display_name : null
              });
          })
          .then(res => {
            pid = parseInt(res.pid);
            //Generate activation link
            return Person.generateActivationLink(pid);
          })
          .then(res => {
            let mailContent = Person.composeActivationMail(body.display_name, res);
            return helpers.sendMail(mailContent.plainContent, mailContent.htmlContent, 'Activation Iran-Insight Account', body.email);
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
            reject('Error. Duplicate link');
          if(res.length === 1)
            resolve(res[0].pid);
          else
            reject('This activation link is expired');
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