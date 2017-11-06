/**
 * Created by ali71 on 14/08/2017.
 */
const bluebird = require('bluebird');
const redis_socket = require('socket.io-redis');
const redis = require('redis');
const env = require('../env');

let redisIsReady = false, redis_client;

let  redisClientInit = () => {

  return new Promise((resolve, reject) => {
    if (redis_client && redisIsReady) {
      resolve();
    } else {
      redis_client = redis.createClient(env.isProd ? process.env.REDIS_URL : {
        socket_keepalive: true
      });
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
    }
  });
}

  let save = (key, value) => {
    if(redis_client && redisIsReady)
      redis_client.setAsync(key, JSON.stringify(value));
  };

  let get = (key) => {
    return new Promise((resolve, reject) => {
      if(redis_client && redisIsReady)
        redis_client.getAsync(key)
          .then(res => resolve(JSON.parse(res)))
          .catch(err => reject(err));
      else
        reject('Redis is not ready now');
    })
  };


module.exports = {
  redisClientInit,
  redisIsReady,
  redis_client: () => redis_client,
  redis_socket,
  save,
  get,
};