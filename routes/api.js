const lib = require('../lib');
const express = require('express');
const router = express.Router();
const passport = require('passport');

function apiResponse(className, functionName, adminOnly=false, reqFuncs=[]){
  let args = Array.prototype.slice.call(arguments, 4);
  let deepFind = function(obj, pathStr){
    let path = pathStr.split('.');
    let len=path.length;
    for (let i=0; i<len; i++){
      if(typeof obj === 'undefined') {
        if(path[i - 1] && path[i - 1][0]==='?') {
          return undefined;
        } else {
          let err = new Error(`Bad request: request.${pathStr} is not found at '${path[i - 1]}'`);
          err.status = 400;
          throw(err);
        }
      }
      obj = obj[ (path[i][0]==='?') ? path[i].substring(1) : path[i]];
    }
    return obj;
  };
  return(function(req, res) {
    let user = req.user ? req.user.username : req.user;
    req.test = lib.helpers.isTestReq(req);
    if(adminOnly && !lib.helpers.adminCheck(user)) {
      res.status(403)
        .send('Only admin can do this.');
    }
    else {
      let dynamicArgs = [];
      for(let i in reqFuncs)
        dynamicArgs.push((typeof reqFuncs[i]==='function') ? reqFuncs[i](req) : deepFind(req,reqFuncs[i]));

      let allArgs = dynamicArgs.concat(args);
      lib[className].test = req.test;
      let isStaticFunction = typeof lib[className][functionName] === 'function';
      let model = isStaticFunction ? lib[className] : new lib[className](req.test);
      model[functionName].apply(isStaticFunction?null:model, allArgs)
        .then(data=> {
          res.status(200)
            .json(data);
        })
        .catch(err=> {
          console.log(`${className}/${functionName}: `, err.message);
          res.status(err.status||500)
            .send(err.message || err);
        });
    }
  });
}

router.get('/', function(req, res) {
  res.send('respond with a resource');
});
//Login API
router.post('/login', passport.authenticate('local', {}), apiResponse('Person', 'afterLogin', false, [ 'user.username']));
router.post('/loginCheck', apiResponse('Person', 'loginCheck', false, ['body.username', 'body.password']));
router.get('/logout', (req,res)=>{req.logout();res.sendStatus(200)});
router.get('/validUser',apiResponse('Person', 'afterLogin', false, ['user.username']));

//Authentication API
router.get('/login/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email']}));
router.get('/login/google/callback', passport.authenticate('google', {}), apiResponse('Person', 'afterLogin', false, ['user.username']));
router.get('/login/facebook', passport.authenticate('facebook'));
router.get('/login/facebook/callback', passport.authenticate('facebook'), apiResponse('Person', 'afterLogin', false, ['user.username']));
router.get('/login/linkedin', passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_emailaddress'] }));
router.get('/login/linkedin/callback', passport.authenticate('linkedin', {}), apiResponse('Person', 'afterLogin', false, ['user.username']));

//Person API
router.put('/user/register', apiResponse('Person', 'registration', false, ['body']));
router.get('/user/activate/link/:link', apiResponse('Person', 'checkActiveLink', false, ['params.link']));
router.post('/user/auth/local/:link', apiResponse('Person', 'completeAuth', false, ['params.link', 'body']));
router.post('/user/auth/link', apiResponse('Person', 'sendActivationMail', false, ['body.email']));

router.put('/user', apiResponse('Person', 'insert', true, ['body']));
router.get('/user', apiResponse('Person', 'select', true));
// router.post('/user/:pid', apiResponse('Person', 'update', true, ['params.pid','body']));
router.post('/user/profile/:username', apiResponse('Person', 'setProfile', false, ['params.username', 'user.username', 'user.pid', 'body']));
router.delete('/user/:pid', apiResponse('Person', 'delete', true, ['params.pid']));
router.put('/user/message', apiResponse('Person', 'socketHandler', false, ['body']));

//Business API
router.post('/business/profile', apiResponse('Business', 'setProfile', false, ['body', 'user.username', 'user.pid']));

// Organization LCE API
router.put('/business-lce', apiResponse('BusinessLCE', 'saveData', false, ['body']));
router.get('/business-lce/:bid', apiResponse('BusinessLCE', 'getByBid', false, ['params.bid']));



// Organization API
router.get('/organization', apiResponse('Organization', 'getAll', false));
router.get('/organization/:oid', apiResponse('Organization', 'getById', false, ['params.oid']));
router.put('/organization', apiResponse('Organization', 'saveData', false, ['body']));
router.put('/organization/profile', apiResponse('Organization', 'setProfile', false, ['body', 'user.username']));

// Organization LCE API
router.put('/organization-lce', apiResponse('OrganizationLCE', 'saveData', false, ['body']));
router.get('/organization-lce/:oid', apiResponse('OrganizationLCE', 'getByOid', false, ['params.oid']));



//organization type
router.put('/organization-type', apiResponse('OrganizationType', 'saveData', false, ['body' , 'id']));

//representation check API
router.get('/user/checkIfRep',apiResponse('Person','findRepRequests',true, ['user.username']));
router.get('/user/checkIfUser',apiResponse('Person','findMemRequests',false, ['user.username']));
//
//Events API
router.get('/event/:eid', apiResponse('Event', 'load', false, ['params.eid','?user.pid']));
router.put('/event', apiResponse('Event', 'saveData', false, ['body', 'user.pid']));
router.post('/event/:eid', apiResponse('Event', 'saveData', false, ['body', 'user.pid', 'params.eid']));
router.delete('/event/:eid', apiResponse('Event', 'delete', false, ['params.eid', 'user.pid']));

//Attendance API
router.put('/personAttends/:eid', apiResponse('Attendance', 'personAttends', false, ['params.eid', 'body', 'user.pid']));
router.delete('/personAttends/:eid', apiResponse('Attendance', 'personUnattends', false, ['params.eid', 'user.pid']));
router.put('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizAttends', false, ['params.eid', 'body', 'params.bid', 'user.pid']));
router.delete('/bizAttends/:eid/:bid', apiResponse('Attendance', 'bizUnattends', false, ['params.eid', 'params.bid', 'user.pid']));
router.put('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgAttends', false, ['params.eid', 'body', 'params.oid', 'user.pid']));
router.delete('/orgAttends/:eid/:oid', apiResponse('Attendance', 'orgUnattends', false, ['params.eid', 'params.oid', 'user.pid']));

module.exports = router;