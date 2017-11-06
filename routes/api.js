const lib = require('../lib');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const sql = require('../sql');
const error = require('../lib/errors.list');

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
    req.test = lib.helpers.isTestReq(req);

    lib.Person.adminCheck(adminOnly, req.user, req.test)
      .then(rs => {
        if (adminOnly && rs.length < 1)
          return Promise.reject(error.adminOnly);
        else {
          let dynamicArgs = [];
          for (let i in reqFuncs)
            dynamicArgs.push((typeof reqFuncs[i] === 'function') ? reqFuncs[i](req) : deepFind(req, reqFuncs[i]));

          let allArgs = dynamicArgs.concat(args);
          lib[className].test = req.test;
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
        console.log(`${className}/${functionName}: `, err.message);
        res.status(err.status || 500)
          .send(err.message || err);
      });
  });
}

router.get('/', function (req, res) {
  res.send('respond with a resource');
});
// Login API
router.post('/login', passport.authenticate('local', {}), apiResponse('Person', 'afterLogin', false, ['user.username']));
router.post('/loginCheck', apiResponse('Person', 'loginCheck', false, ['body.username', 'body.password']));
router.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(200)
});
router.get('/validUser', apiResponse('Person', 'afterLogin', false, ['user.username']));

// Authentication API
router.get('/login/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email']}));
router.get('/login/google/callback', passport.authenticate('google', {}), apiResponse('Person', 'afterLogin', false, ['user.username']));
router.get('/login/facebook', passport.authenticate('facebook'));
router.get('/login/facebook/callback', passport.authenticate('facebook'), apiResponse('Person', 'afterLogin', false, ['user.username']));
router.get('/login/linkedin', passport.authenticate('linkedin', {scope: ['r_basicprofile', 'r_emailaddress']}));
router.get('/login/linkedin/callback', passport.authenticate('linkedin', {}), apiResponse('Person', 'afterLogin', false, ['user.username']));

// Person API
router.put('/user/register', apiResponse('Person', 'registration', false, ['body']));
router.get('/user/activate/link/:link', apiResponse('Person', 'checkActiveLink', false, ['params.link']));
router.post('/user/auth/local/:link', apiResponse('Person', 'completeAuth', false, ['params.link', 'body']));
router.post('/user/auth/link', apiResponse('Person', 'sendActivationMail', false, ['body.email']));
router.post('/membership/introducing/rep', apiResponse('Person', 'introduceAsRep', false, ['body', 'user.display_name_en', 'user.pid']));

router.put('/user', apiResponse('Person', 'insert', true, ['body']));
router.get('/user', apiResponse('Person', 'select', true));
// router.post('/user/:pid', apiResponse('Person', 'update', true, ['params.pid','body']));
router.post('/user/profile', apiResponse('Person', 'setProfile', false, ['user.pid', 'body']));
router.delete('/user/:pid', apiResponse('Person', 'delete', true, ['params.pid']));
router.put('/user/message', apiResponse('Person', 'socketHandler', false, ['body']));
router.put('/follow/business/:bid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.put('/follow/organization/:oid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.put('/follow/person/:pid', apiResponse('Person', 'followingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/business/:bid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/organization/:oid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));
router.delete('/follow/person/:pid', apiResponse('Person', 'unfollowingEntity', false, ['user.pid', 'params.pid', 'params.bid', 'params.oid']));

//Expertise API
router.put('/expertise', apiResponse('Expertise', 'addExpertise', true, ['body']));
router.post('/user/expertise', apiResponse('Person', 'setExpertise', false, ['user.pid', 'body']));
router.get('/user/:pid/expertise', apiResponse('Person', 'getExpertise', false, ['user.pid', 'params.pid']));
router.delete('/expertise', apiResponse('Person', 'deleteExpertise', false, ['user.pid', 'body']));

// Partnership
router.get('/person/partnership/:pid', apiResponse('Person', 'getPartnership', false, ['user.pid', 'params.pid']));
router.get('/person/requested/partnership', apiResponse('Person', 'getRequestedPartnership', false, ['user.pid']));
router.put('/person/partnership', apiResponse('Person', 'setPartnership', false, ['user.pid', 'body']));
router.post('/person/confirm/partnership', apiResponse('Person', 'confirmPartnership', false, ['user.pid', 'body']));
router.delete('/person/partnership', apiResponse('Person', 'deletePartnership', false, ['user.pid', 'body']));



// Business API
router.post('/business/profile', apiResponse('Business', 'setProfile', false, ['body', 'user.pid']));
router.put('/business/product', apiResponse('Business', 'addProduct', true, ['body']));
router.post('/business/product', apiResponse('Business', 'addBusinessProduct', false, ['body', 'user.pid']));
router.get('/business/product/all', apiResponse('Business', 'getAllProducts', false));
router.get('/business/product/:product_id', apiResponse('Business', 'getProduct', false, ['params.product_id']));
router.delete('/business/product', apiResponse('Business', 'removeBizOfProduct', false, ['body', 'user.pid']));

// Business LCE API
router.put('/business-lce', apiResponse('Business', 'setLCE', false, ['body','user.pid']));
router.post('/business-lce/confirm', apiResponse('Business', 'confirmLCE', false, ['user.pid','body']));
router.get('/business-lce/:bid', apiResponse('Business', 'getLCE', false, ['user.pid', 'params.bid']));
router.get('/business-lce/requested/:bid', apiResponse('Business', 'getRequestedLCE', false, ['user.pid' , 'params.bid']));
router.delete('/business-lce', apiResponse('Business', 'deleteLCE', false, ['user.pid', 'body']));


// Organization API
router.get('/organization', apiResponse('Organization', 'getAll', false));
router.get('/organization/:oid', apiResponse('Organization', 'getById', false, ['params.oid']));
router.put('/organization', apiResponse('Organization', 'saveData', false, ['body']));
router.post('/organization/profile', apiResponse('Organization', 'setProfile', false, ['body', 'user.pid']));

// Organization LCE API
router.put('/organization-lce', apiResponse('Organization', 'setLCE', false, ['body','user.pid']));
router.post('/organization-lce/confirm', apiResponse('Organization', 'confirmLCE', false, ['user.pid','body']));
router.get('/organization-lce/:oid', apiResponse('Organization', 'getLCE', false, ['user.pid', 'params.oid']));
router.get('/organization-lce/requested/:oid', apiResponse('Organization', 'getRequestedLCE', false, ['user.pid' , 'params.oid']));
router.delete('/organization-lce', apiResponse('Organization', 'deleteLCE', false, ['user.pid', 'body']));


// Organization type
router.put('/organization-type', apiResponse('OrganizationType', 'saveData', false, ['body', 'id']));

// Representation-chekc API
router.get('/user/getRepPendingList',apiResponse('Person','findRepRequests',true));
router.put('/user/confirmRep/:mid/:aid',apiResponse('Person','confirmRepByAdmin',true,['params.mid','params.aid']));
router.delete('/user/deleteRep/:mid',apiResponse('Person','deleteRepRequest',true,['params.mid']));
router.delete('/user/deleteRepBizOrg/:mid',apiResponse('Person','deleteRepAndHisCompany',true,['params.mid']));

//Events API
router.get('/event/:eid', apiResponse('Event', 'load', false, ['params.eid', '?user.pid']));
router.put('/event', apiResponse('Event', 'saveData', false, ['body', 'user.pid']));
router.post('/event/:eid', apiResponse('Event', 'saveData', false, ['body', 'user.pid', 'params.eid']));
router.delete('/event/:eid', apiResponse('Event', 'delete', false, ['params.eid', 'user.pid']));

// Attendance API
router.put('/personAttends/:eid', apiResponse('Attendance', 'personAttends', false, ['params.eid', 'body', 'user.pid']));
router.delete('/personAttends/:eid', apiResponse('Attendance', 'personUnattends', false, ['params.eid', 'user.pid']));
router.put('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizAttends', false, ['params.eid', 'body', 'params.bid', 'user.pid']));
router.delete('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizUnattends', false, ['params.eid', 'params.bid', 'user.pid']));
router.put('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgAttends', false, ['params.eid', 'body', 'params.oid', 'user.pid']));
router.delete('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgUnattends', false, ['params.eid', 'params.oid', 'user.pid']));

// Joiners API
router.get('/joiners', apiResponse('Joiner', 'select', false, ['user.pid']));
router.put('/joiner/:mid', apiResponse('Joiner', 'saveData', false, ['params.mid', 'user.pid']));
router.delete('/joiner/:mid/:aid', apiResponse('Joiner', 'delete', false, ['params.mid', 'params.aid', 'user.pid']));

// Investment API
router.get('/investment/business/:bid', apiResponse('Investment', 'getByBiz', false, ['params.bid']));
router.get('/investment/organization/:oid', apiResponse('Investment', 'getByOrg', false, ['params.oid']));
router.get('/investment/person/:pid', apiResponse('Investment', 'getByPerson', false, ['params.pid']));
router.get('/investment/pending/business', apiResponse('Investment', 'getBizPending', false, ['user.pid']));
router.get('/investment/pending/organization', apiResponse('Investment', 'getOrgPending', false, ['user.pid']));
router.get('/investment/pending/person', apiResponse('Investment', 'getPersonalPending', false, ['user.pid']));
router.put('/personalInvestment/:bid/:pid', apiResponse('Investment', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user.pid']));
router.put('/orgInvestment/:bid/:oid', apiResponse('Investment', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user.pid']));
router.post('/personalInvestment/:id/:bid/:pid', apiResponse('Investment', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user.pid', 'params.id']));
router.post('/orgInvestment/:id/:bid/:oid', apiResponse('Investment', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user.pid', 'params.id']));
router.put('/investment/:id', apiResponse('Investment', 'confirm', false, ['params.id', 'user.pid']));
router.delete('/investment/:id', apiResponse('Investment', 'delete', false, ['params.id', 'user.pid']));

// Consultancy API
router.get('/consultancy/business/:bid', apiResponse('Consultancy', 'getByBiz', false, ['params.bid']));
router.get('/consultancy/organization/:oid', apiResponse('Consultancy', 'getByOrg', false, ['params.oid']));
router.get('/consultancy/person/:pid', apiResponse('Consultancy', 'getByPerson', false, ['params.pid']));
router.get('/consultancy/pending/business', apiResponse('Consultancy', 'getBizPending', false, ['user.pid']));
router.get('/consultancy/pending/organization', apiResponse('Consultancy', 'getOrgPending', false, ['user.pid']));
router.get('/consultancy/pending/person', apiResponse('Consultancy', 'getPersonalPending', false, ['user.pid']));
router.put('/personalConsultancy/:bid/:pid', apiResponse('Consultancy', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user.pid']));
router.put('/orgConsultancy/:bid/:oid', apiResponse('Consultancy', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user.pid']));
router.post('/personalConsultancy/:id/:bid/:pid', apiResponse('Consultancy', 'savePersonal', false, ['params.bid', 'params.pid', 'body', 'user.pid', 'params.id']));
router.post('/orgConsultancy/:id/:bid/:oid', apiResponse('Consultancy', 'saveOrganizational', false, ['params.bid', 'params.oid', 'body', 'user.pid', 'params.id']));
router.put('/consultancy/:id', apiResponse('Consultancy', 'confirm', false, ['params.id', 'user.pid']));
router.delete('/consultancy/:id', apiResponse('Consultancy', 'delete', false, ['params.id', 'user.pid']));

module.exports = router;
