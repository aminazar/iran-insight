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
        let err = new Error(`Bad request: request.${pathStr} is not found at '${path[i]}'`);
        err.status = 400;
        throw(err);
      }
      obj = obj[path[i]];
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
router.post('/login', passport.authenticate('local', {}), apiResponse('User', 'afterLogin', false, [ 'user.username']));
router.post('/loginCheck', apiResponse('User', 'loginCheck', false, ['body.username', 'body.password']));
router.get('/logout', (req,res)=>{req.logout();res.sendStatus(200)});
router.get('/validUser',apiResponse('User', 'afterLogin', false, ['user.username']));

//Authentication API
router.get('/login/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email']}));
router.get('/login/google/callback', passport.authenticate('google', {}), apiResponse('User', 'afterLogin', false, ['user.username']));
router.get('/login/facebook', passport.authenticate('facebook'));
router.get('/login/facebook/callback', passport.authenticate('facebook'), apiResponse('User', 'afterLogin', false, ['user.username']));
router.get('/login/linkedin', passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_emailaddress'] }));
router.get('/login/linkedin/callback', passport.authenticate('linkedin', {}), apiResponse('User', 'afterLogin', false, ['user.username']));

//User API
router.put('/user', apiResponse('User', 'insert', true, ['body']));
router.get('/user', apiResponse('User', 'select', true));
router.post('/user/:pid', apiResponse('User', 'update', true, ['params.pid','body']));
router.delete('/user/:pid', apiResponse('User', 'delete', true, ['params.pid']));
router.put('/user/message', apiResponse('User', 'socketHandler', false, ['body']));
// Organization API
router.get('/organization/:oid', apiResponse('Organization', 'select' , false, ['params.oid']));

//Events API
router.get('/event/:eid', apiResponse('Event', 'load', false, ['params.eid']));
router.put('/event', apiResponse('Event', 'saveData', false, ['body']));

module.exports = router;