/**
 * Created by ali71 on 14/08/2017.
 */
const bluebird = require('bluebird');
const redis_socket = require('socket.io-redis');
const redis = require('redis');
const env = require('../env');

let redisIsReady = false;
let redis_client, redis_sub;

let redisClientInit = () => {
  return new Promise((resolve, reject) => {
    if (!redisIsReady) {
      redis_client = redis.createClient(env.isProd ? process.env.REDIS_URL : {socket_keepalive: true});
      redis_sub = redis.createClient(env.isProd ? process.env.REDIS_URL : {socket_keepalive: true});

      bluebird.promisifyAll(redis.RedisClient.prototype);
      bluebird.promisifyAll(redis.Multi.prototype);

      redis_client.on('ready', () => {
        console.log('Redis is ready');
        redisIsReady = true;
        resolve();
      });

      redis_client.on('error', (err) => {
        console.log('Redis is down.The error message is: ', err);
        redisIsReady = false;
        reject();
      });
    } else {
      resolve();
    }
  });
};

let save = (key, value) => {
  return new Promise((resolve, reject) => {
    if (redisIsReady) {
      redis_client.setAsync(key, JSON.stringify(value)).then(resolve).catch(reject);
    } else {
      reject('Redis is not ready now');
    }
  });
};

let get = (key) => {
  return new Promise((resolve, reject) => {
    if (redisIsReady)
      redis_client.getAsync(key)
        .then(res => resolve(JSON.parse(res)))
        .catch(err => reject(err));
    else
      reject('Redis is not ready now');
  })
};


module.exports = {
  redisClientInit,
  redisIsReady: () => redisIsReady,
  redis_client: () => redis_client,
  redis_sub: () => redis_sub,
  redis_socket,
  save,
  get,
};