let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
const multer = require('multer');
const env = require('./env');

let index = require('./routes/index');
let api = require('./routes/api');
let lib = require('./lib');
let app = express();
let isReady = false;
let ns; // Notification System
const detector = require('spider-detector');

const passport = require('./passport');
const session = require('./session');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(detector.middleware());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(__dirname + '/documents/profile-image'));
app.use(express.static(path.join(__dirname, 'public')));

session.setup(app)
  .then(() => {
    isReady = true;
    passport.setup(app);

    app.use('/', index);
    app.use('/api', api);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      let err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    lib.NotificationSystem.setup()
      .then(()=> {
        ns = lib.NotificationSystem.get();
        ns.start();
        console.log('Notification System is ready.')
      })
      .catch(err => {
        console.error(err);
        throw(err);
      });

    // error handler
    app.use(function (err, req, res, next) {
      let jsonError = req.app.get('env') === 'development' ? {
        Message: err.message,
        Stack: err.stack,
      } : {Message: err};
      res.status(err.status || 500).json(jsonError);

    });
  });


module.exports = {
  get: () => app,
  isReady: () => isReady,
};
