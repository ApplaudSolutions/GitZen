const BluebirdPromise = require('bluebird');
const config = require('../config.json');
const request = require('request').defaults({
  baseUrl: 'https://api.zenhub.io/',
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12',
    'Content-type': 'application/json',
    'X-Authentication-Token': config.zenhubToken,
  },
  json: true,
});

const getBoardData = (repo) => {
  return new BluebirdPromise((resolve, reject) => {
    const url = `p1/repositories/${repo}/board`;
    request({uri: url}, (err, res, body) => {
      // console.log(body.pipelines.map((pipeline) => pipeline.name));
      resolve(body.pipelines);
    });
  });
};

module.exports = {
  getBoardData,
};