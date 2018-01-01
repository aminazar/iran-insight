const lib = require('../lib');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const sql = require('../sql');
const error = require('../lib/errors.list');
const env = require('../env');
const path = require('path');
const app = require('../app');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: env.uploadPath + path.sep,
  filename: (req, file, cb) => {
    cb(null, [req.params.username || req.user.username, file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1)].join('.'));
  }
});
var upload = multer({storage: storage});

function apiResponse(className, functionName, adminOnly = false, reqFuncs = []) {
  let args = Array.prototype.slice.call(arguments, 4);
  let deepFind = function (obj, pathStr) {
    let path = pathStr.split('.');
    let len = path.length;
    for (let i = 0; i < len; i++) {
      if (typeof obj === 'undefined') {
        if (path[i - 1] && path[i - 1][0] === '?') {
          return undefined;
        } else {
          let err = new Error(`Bad request: request.${pathStr} is not found at '${path[i - 1]}'`);
          err.status = 400;
          throw(err);
        }
      }
      obj = obj[(path[i][0] === '?') ? path[i].substring(1) : path[i]];
    }
    return obj;
  };

  return (function (req, res) {
    lib.Person.adminCheck(adminOnly, req.user, req.test)
      .then(rs => {
        if (adminOnly && rs.length < 1)
          return Promise.reject(error.adminOnly);
        else {
          let dynamicArgs = [];
          for (let i in reqFuncs)
            dynamicArgs.push((typeof reqFuncs[i] === 'function') ? reqFuncs[i](req) : deepFind(req, reqFuncs[i]));

          let allArgs = dynamicArgs.concat(args);

          for (cn in lib)
            lib[cn].test = req.test;

          let isStaticFunction = typeof lib[className][functionName] === 'function';
          let model = isStaticFunction ? lib[className] : new lib[className](req.test);
          return model[functionName].apply(isStaticFunction ? null : model, allArgs);
        }
      })
      .then(data => {
        res.status(200)
          .json(data);
      })
      .catch(err => {
        console.log(`${className}/${functionName}: `, req.app.get('env') === 'development' ? err : err.message);
        res.status(err.status || 500)
          .send(err.message || err);
      });
  });
}

router.get('/', function (req, res) {
  res.send('respond with a resource');
});
// Login API
router.post('/login', passport.authenticate('local', {}), apiResponse('Person', 'afterLogin', false, ['user']));
router.post('/loginCheck', apiResponse('Person', 'loginCheck', false, ['body.username', 'body.password']));
router.get('/logout', (req, res) => {
  req.logout();
  res.status(200).json('')
});
router.get('/validUser', apiResponse('Person', 'afterLogin', false, ['user']));

// Open Authentication API
router.get('/login/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email']}));
router.get('/login/google/callback', passport.authenticate('google', {
  successRedirect : '/login/oauth',
  failureRedirect : '/login'
}));
router.get('/login/facebook', passport.authenticate('facebook'));
router.get('/login/client/facebook/callback', passport.authenticate('facebook', {
  successRedirect : '/login/oauth',
  failureRedirect : '/login'
}));
router.get('/login/linkedin', passport.authenticate('linkedin', {scope: ['r_basicprofile', 'r_emailaddress']}));
router.get('/login/client/linkedin/callback', passport.authenticate('linkedin', {
  successRedirect : '/login/oauth',
  failureRedirect : '/login'
}));

// Person API
router.put('/user/register', apiResponse('Person', 'registration', false, ['body']));
router.post('/user/email/isExist', apiResponse('Person', 'emailIsExist', false, ['body']));
router.get('/user/activate/link/:link', apiResponse('Person', 'checkActiveLink', false, ['params.link']));
router.post('/user/auth/local/:link', apiResponse('Person', 'completeAuth', false, ['params.link', 'body']));
router.post('/user/auth/link', apiResponse('Person', 'sendActivationMail', false, ['body.email', 'body.is_forgot_mail']));
router.post('/membership/introducing/rep', apiResponse('Person', 'introduceAsRep', false, ['body', 'user']));
router.post('/profile/image/:pid', upload.single('image'), apiResponse('Person', 'setProfileImage', false, ['user.pid', 'params.pid', 'file']));
router.post('/profile/image/:username/:pid', upload.single('image'), apiResponse('Person', 'setProfileImage', true, ['user.pid', 'params.pid', 'file']));
router.get('/profile/image/:pid', apiResponse('Person', 'getProfileImage', false, ['params.pid']));
router.delete('/profile/image/:pid', apiResponse('Person', 'deleteProfileImage', false, ['user.pid', 'params.pid']));

router.put('/user', apiResponse('Person', 'insert', true, ['body']));
router.get('/user', apiResponse('Person', 'select', true));
// router.post('/user/:pid', apiResponse('Person', 'update', true, ['params.pid','body']));
router.post('/user/profile', apiResponse('Person', 'setProfile', false, ['user', 'body']));
router.get('/user/profile/:pid', apiResponse('Person', 'getPersonInfo', false, ['user.pid', 'params.pid']));
router.delete('/user/:pid', apiResponse('Person', 'delete', true, ['params.pid']));
router.put('/user/message', apiResponse('Person', 'socketHandler', false, ['body']));
router.put('/follow/business/:bid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.put('/follow/organization/:oid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.put('/follow/person/:pid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/business/:bid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/organization/:oid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/person/:pid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));

router.get('/user/unsubscribe/:pid/:hash', apiResponse('Person', 'unsubscribe', false, ['params.pid', 'params.hash']));

//Expertise API
router.put('/expertise', apiResponse('Expertise', 'addExpertise', true, ['body']));
router.get('/expertise', apiResponse('Expertise', 'getAll', false, ['body']));
router.get('/expertise/:expertise_id', apiResponse('Expertise', 'get', false, ['params.expertise_id']));
router.post('/user/expertise', apiResponse('Person', 'setExpertise', false, ['user', 'body']));
router.get('/user/:pid/expertise', apiResponse('Person', 'getExpertise', false, ['user.pid', 'params.pid']));
router.delete('/expertise/:pid/:expertise_id', apiResponse('Person', 'deleteExpertise', false, ['user', 'params.pid', 'params.expertise_id']));


// Notification
router.post('/user/notify', apiResponse('Person', 'changeNotifyType', false, ['user.pid', 'body']));

// Partnership
router.get('/person/partnership/:pid/:offset/:limit', apiResponse('Person', 'getPartnershipList', false, ['user.pid', 'params.pid','params.offset' , 'params.limit']));
router.get('/person/partnership/:id', apiResponse('Person', 'getPartnershipDetail', false, ['user.pid', 'params.id']));
router.get('/person/requested/partnership', apiResponse('Person', 'getRequestedPartnership', false, ['user.pid']));
router.put('/person/partnership', apiResponse('Person', 'setPartnership', false, ['user', 'body']));
router.post('/person/confirm/partnership', apiResponse('Person', 'confirmPartnership', false, ['user', 'body']));
router.delete('/person/partnership/:pid', apiResponse('Person', 'deletePartnership', false, ['user', 'params.pid']));


// Business API
router.get('/business/one/:bid', apiResponse('Business', 'getOne', false, ['params']));
router.get('/business/oneAll/:bid', apiResponse('Business', 'getOneAll', false, ['params']));
router.post('/business/profile', apiResponse('Business', 'setProfile', false, ['body', 'user.pid']));
router.get('/product/all', apiResponse('Business', 'getAllProducts', false));
router.get('/product/one/:product_id', apiResponse('Business', 'getProduct', false, ['params.product_id']));
router.delete('/person/partnership/:pid', apiResponse('Person', 'deletePartnership', false, ['user', 'params.pid']));

// Product API
router.get('/product/one/:product_id', apiResponse('Business', 'getProduct', false, ['params.product_id']));
router.put('/business/product/:business_id', apiResponse('Business', 'addBusinessProduct', false, ['params.business_id','body', 'user.pid']));
router.delete('/business/product/:business_id/:product_id', apiResponse('Business', 'removeBizOfProduct', false, ['params.business_id','params.product_id', 'user.pid']));
router.post('/business/product/:business_id/:product_id', apiResponse('Business', 'updateProduct', false, ['params.business_id','params.product_id','body', 'user.pid']));
router.get('/business/product/all/:business_id', apiResponse('Business', 'allProducts', false, ['params']));
router.get('/business/product/one/:business_id', apiResponse('Business', 'oneProduct', false, ['params']));


// Organization API
router.get('/organization', apiResponse('Organization', 'getAll', false));
router.get('/organization/:oid', apiResponse('Organization', 'getById', false, ['params.oid']));
router.put('/organization', apiResponse('Organization', 'saveData', false, ['body']));
router.post('/organization/profile', apiResponse('Organization', 'setProfile', false, ['body', 'user.pid']));


// LCE API
router.put('/lce/:type', apiResponse('LCE', 'setLCE', false, ['params.type', 'user.pid', 'body']));
router.post('/lce/:type/confirm', apiResponse('LCE', 'confirmLCE', false, ['params.type', 'user.pid', 'body']));
router.get('/lce/:type/:id/:lceId', apiResponse('LCE', 'getLCEDetail', false, ['params.type', 'user.pid', 'params.id', 'params.lceId']));
router.get('/lce/:type/:id/:offset/:limit', apiResponse('LCE', 'getLCEList', false, ['params.type', 'user.pid', 'params.id', 'params.offset' , 'params.limit']));
router.get('/lce/:type/requested/:id/:offset/:limit', apiResponse('LCE', 'getRequestedLCE', false, ['params.type', 'user.pid', 'params.id','params.offset' , 'params.limit']));
router.delete('/lce/:type/:id', apiResponse('LCE', 'deleteLCE', false, ['params.type', 'user', 'params.id']));

// types
router.post('/type/:name', apiResponse('Type', 'suggest', false, ['user.pid', 'params.name', 'body']));
router.put('/type/:name/:type_id', apiResponse('Type', 'update', true, ['params.name', 'params.type_id', 'body']));
router.delete('/type/:name/:type_id', apiResponse('Type', 'delete', true, ['params.name', 'params.type_id']));
router.get('/type/getCats', apiResponse('Type', 'getTypes', true, []));
router.get('/type/:name/:type_id', apiResponse('Type', 'getInfo', true, ['params.name', 'params.type_id']));

// tags
router.put('/tag/add_all', apiResponse('Tag', 'addAll', true, ['body']));
router.put('/tag/add', apiResponse('Tag', 'setTag', false, ['user.pid', 'body']));
router.post('/tag/confirm/:tid', apiResponse('Tag', 'confirm', true, ['params.tid']));
router.delete('/tag/removeFrom', apiResponse('Tag', 'removeTagFromTarget', false, ['user.pid', 'body']));
router.get('/tag/:type/:id', apiResponse('Tag', 'getTags', false, ['user.pid', 'params.type', 'params.id']));

// Representation-check API
router.get('/joiner/getRepPendingList', apiResponse('Joiner', 'findRepRequests', true));
router.put('/joiner/confirmRep/:mid/:aid', apiResponse('Joiner', 'confirmRepByAdmin', true, ['params.mid', 'params.aid', 'user']));
router.delete('/joiner/deleteRep/:mid', apiResponse('Joiner', 'deleteRepRequest', true, ['user', 'params.mid']));
router.delete('/Joiner/deleteRepBizOrg/:mid', apiResponse('Joiner', 'deleteRepAndHisCompany', true, ['params.mid']));

// upsert/delete an authoritative user(rep/regular)
router.delete('/joiner/deleteUserOrRepAfterConfirm/:mid', apiResponse('Joiner', 'deleteUserOrRepAfterConfirm', false, ['params.mid', 'user.pid']));
router.post('/joiner/upsert/membership', apiResponse('Joiner', 'upsertMembership', true, ['body', 'user.pid']));

// Joiners API
router.get('/joiners/org/:oid', apiResponse('Joiner', 'getOrgBizMembers', true, ['?params.bid', '?params.oid']));
router.get('/joiners/biz/:bid', apiResponse('Joiner', 'getOrgBizMembers', true, ['?params.bid', '?params.oid']));
router.get('/joiners', apiResponse('Joiner', 'select', false, ['user.pid']));
router.put('/joiner/:mid', apiResponse('Joiner', 'saveData', false, ['params.mid', 'user'])); //just confirm a membership by admin or representative
router.delete('/joiner/:mid/:aid', apiResponse('Joiner', 'delete', false, ['params.mid', 'params.aid', 'user']));

//Events API
router.get('/event/:eid', apiResponse('Event', 'load' , false, ['params.eid', '?user.pid']));
router.put('/event', apiResponse('Event', 'saveData', false, ['body', 'user']));
router.post('/event/:eid', apiResponse('Event', 'saveData', false, ['body', 'user', 'params.eid']));
router.delete('/event/:eid', apiResponse('Event', 'delete', false, ['params.eid', 'user']));

// Attendance API
router.put('/personAttends/:eid', apiResponse('Attendance', 'personAttends', false, ['params.eid', 'body', 'user']));
router.delete('/personAttends/:eid', apiResponse('Attendance', 'personUnattends', false, ['params.eid', 'user']));
router.put('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizAttends', false, ['params.eid', 'body', 'params.bid', 'user.pid']));
router.delete('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizUnattends', false, ['params.eid', 'params.bid', 'user.pid']));
router.put('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgAttends', false, ['params.eid', 'body', 'params.oid', 'user.pid']));
router.delete('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgUnattends', false, ['params.eid', 'params.oid', 'user.pid']));
router.get('/attendee/:eid', apiResponse('Attendance', 'getAttendees', false, ['params.eid']));
router.delete('/attendance/:id', apiResponse('Attendance', 'deleteAttendance', true, ['params.id']));
router.put('/attends/:eid', apiResponse('Attendance', 'attends', true, ['params.eid', 'body', 'user']));
router.post('/attendee/:id', apiResponse('Attendance', 'updateAttendee', false, ['params.id', 'body']));
router.get('/attendance/types', apiResponse('Attendance', 'getTypes', false, []));

// Investment API
router.get('/investment/business/:bid', apiResponse('Investment', 'getByBiz', false, ['params.bid']));
router.get('/investment/organization/:oid', apiResponse('Investment', 'getByOrg', false, ['params.oid']));
router.get('/investment/person/:pid', apiResponse('Investment', 'getByPerson', false, ['params.pid']));
router.get('/investment/pending/business', apiResponse('Investment', 'getBizPending', false, ['user.pid']));
router.get('/investment/pending/organization', apiResponse('Investment', 'getOrgPending', false, ['user.pid']));
router.get('/investment/pending/person', apiResponse('Investment', 'getPersonalPending', false, ['user.pid']));
router.put('/personalInvestment/:bid/:pid', apiResponse('Investment', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user']));
router.put('/orgInvestment/:bid/:oid', apiResponse('Investment', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user']));
router.post('/personalInvestment/:id/:bid/:pid', apiResponse('Investment', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user', 'params.id']));
router.post('/orgInvestment/:id/:bid/:oid', apiResponse('Investment', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user', 'params.id']));
router.put('/investment/:id', apiResponse('Investment', 'confirm', false, ['params.id', 'user']));
router.delete('/investment/:id', apiResponse('Investment', 'delete', false, ['params.id', 'user']));

// Consultancy API
router.get('/consultancy/business/:bid', apiResponse('Consultancy', 'getByBiz', false, ['params.bid']));
router.get('/consultancy/organization/:oid', apiResponse('Consultancy', 'getByOrg', false, ['params.oid']));
router.get('/consultancy/person/:pid', apiResponse('Consultancy', 'getByPerson', false, ['params.pid']));
router.get('/consultancy/pending/business', apiResponse('Consultancy', 'getBizPending', false, ['user.pid']));
router.get('/consultancy/pending/organization', apiResponse('Consultancy', 'getOrgPending', false, ['user.pid']));
router.get('/consultancy/pending/person', apiResponse('Consultancy', 'getPersonalPending', false, ['user.pid']));
router.put('/personalConsultancy/:bid/:pid', apiResponse('Consultancy', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user']));
router.put('/orgConsultancy/:bid/:oid', apiResponse('Consultancy', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user']));
router.post('/personalConsultancy/:id/:bid/:pid', apiResponse('Consultancy', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user', 'params.id']));
router.post('/orgConsultancy/:id/:bid/:oid', apiResponse('Consultancy', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user', 'params.id']));
router.put('/consultancy/:id', apiResponse('Consultancy', 'confirm', false, ['params.id', 'user']));
router.delete('/consultancy/:id', apiResponse('Consultancy', 'delete', false, ['params.id', 'user']));

//Search API
router.post('/search/:offset/:limit', apiResponse('SearchSystem', 'search', false, ['body', 'params.offset', 'params.limit']));
router.post('/suggest', apiResponse('SearchSystem', 'suggest', false, ['body']));
router.post('/searchOnProduct/:offset/:limit', apiResponse('SearchSystem', 'searchOnProduct', false, ['product','body', 'params.offset', 'params.limit']));

module.exports = router;
