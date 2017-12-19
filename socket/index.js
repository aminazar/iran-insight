/**
 * Created by ali71 on 05/08/2017.
 */
let session = require('../session')
const socketIOSession = require('socket.io.session');
const socketRoutes = require('./socketRoutes');
const passportSocketIO = require('passport.socketio');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const redis = require('../redis');
const env = require('../env');

let io;
let running = false;
let BROADCAST_MESSAGE = 'BROADCAST_MESSAGE';
let NEW_MESSAGE = 'NEW_MESSAGE';

let setup = (http) => {
  new Promise( resolve => {
    let configChecker = setInterval(() => {
      if (running) {
        resolve();
      }
      if (session.session_config()) {
        // io = require('socket.io')(http);
        // io.use(passportSocketIO.authorize({
        //   key: 'connect.sid',
        //   secret: 'ManKhazID',
        //   store: session.session_config().store,
        //   passport: passport,
        //   cookieParser: cookieParser,
        //   success: onAuthorizeSuccess,
        //   fail: onAuthorizeFail
        // }));
        // io.adapter(redis.redis_socket(env.isProd ? {url: process.env.REDIS_URL} : {host: 'localhost', port: 6379}));
        // // io.set('transports', ['websocket']);
        //
        // let socketSession = socketIOSession(session.session_config());
        //
        // //Parse the "/" namespace
        // io.use(socketSession.parser);
        //
        // socketRoutes.setup(io, socketSession.parser);
        // console.log('Socket set up.');
        // running = true;
        resolve();

        clearInterval(configChecker);
      } else {
        console.log('session config is not ready yet');
      }
    }, 1000);
  });
};

function onAuthorizeSuccess(data, accept) {
  console.log('Successful connection to socket.io');
  accept();
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
    accept(new Error(message));

  console.log('Failed connection to socket.io: ', message);
  accept(null, false);
}

/*
Write here your socket handler functions
 */
let sendNewMessageToAllClient = (data) => {
  return promise(BROADCAST_MESSAGE, data[0], socketRoutes.getUserIO())
};

let sendMessage = (data, namespace) => {
  return new Promise((resolve, reject) => {
    socketRoutes.isNamespaceExist(namespace)
      .then(ns => {
        if(ns)
          promise(NEW_MESSAGE, data, ns)
            .then(res => resolve(res))
            .catch(err => {
              console.log('Error when calling promise function: ', err);
              reject(err);
            });
        else
          reject('No namespace found');
      })
  });
};

let promise = (cmd, data, io) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let message = {
        cmd: cmd,
        msg: data
      };

      io.emit('msg', message);

      resolve(data);
    }, 0)
  })
};

module.exports = {
  setup,
  sendNewMessageToAllClient,
  sendMessage,
  storeNamespace: socketRoutes.saveNamespace,
  getNamespace: socketRoutes.isNamespaceExist,
  deleteNamespace: socketRoutes.deleteNamespace,
};