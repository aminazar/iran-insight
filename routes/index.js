const express = require('express');
const router = express.Router();
const path = require('path');

/* Diverting unknown routes to Angular router */
router.all("*",function(req,res,next){
  if(req.originalUrl.indexOf('api') === -1 && !req.isSpider() && !req.headers.debug) {
    console.log('[TRACE] Server 404 request: ' + req.originalUrl);
    let p = path.join(__dirname, '../public', 'index.html').replace(/\/routes\//, '/');
    res.status(200).sendFile(p);
  }
  else
    next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Iran Insight' });
});

router.get('/businsess', (req, res) => {
  res.render('')
});

router.get('/organization', (req, res) => {
  res.render('')
});


router.get('/orgPerson/:oid', (req, res) => {
  res.render('')
});


router.get('/businsess', (req, res) => {
  res.render('')
});

router.get('bizPerson/:bid', (req, res) => {
  res.render('')
});
module.exports = router;
