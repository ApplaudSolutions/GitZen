const BluebirdPromise = require('bluebird');
const config = require('../config.json');
const request = require('request').defaults({
  baseUrl: 'https://api.github.com/',
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12',
    'Content-type': 'application/json',
    "Authorization": `token ${config.githubToken}`
  },
  qs: {
    access_token: config.githubToken
  },
  json: true,
});

const getInfoUrl = (arg) => {
  let options;
  if (typeof arg === 'string') {
    options = {
      uri: arg,
    }
  } else {
    options = arg;
  }
  console.log(JSON.stringify(options));
  return new BluebirdPromise((resolve, reject) => {
    request(options, (err, res, body) => {
      // console.log(res.headers);
      if(err) {
        return reject(err);
      }
      resolve(body);
    });
  });
};

const getAllCtxItems = (url, filter) => {
  return new BluebirdPromise((resolve, reject) => {
    if (!filter) {
      filter = {};
    }
    let allItems = [];
    const iterate = (pageNum) => {
      pageNum = pageNum || 1;
      console.log('fetching pageNUm: ', pageNum);
      filter.page = pageNum;
      getInfoUrl({
        uri: url,
        qs: filter,
      }).then((items) => {
        console.log(items.length);
        if(items.length > 0) {
          allItems = allItems.concat(items);
          iterate(pageNum+1)
        } else {
          resolve(allItems);
        }
      })
    };
    iterate();
  });
};

const getRepos = () => getAllCtxItems(`/orgs/${config.org}/repos`);
const getMilestones = (repoName) => getAllCtxItems(`/repos/${config.org}/${repoName}/milestones`, {state: 'all'});
const getLabels = (repoName) => getAllCtxItems(`/repos/${config.org}/${repoName}/labels`);
const getAssignees = (repoName) => getAllCtxItems(`/repos/${config.org}/${repoName}/assignees`);
const getIssues = (repoName, filter) => getAllCtxItems(`/repos/${config.org}/${repoName}/issues`, filter);
const getIssuesByNumbers = (repoName, issueNumbers) => {
  const issueDataPromises = issueNumbers.map((issueNum) => {
    return getInfoUrl(`/repos/${config.org}/${repoName}/issues/${issueNum}`);
  });
  return BluebirdPromise.all(issueDataPromises);
};

module.exports = {
  getRepos,
  getMilestones,
  getLabels,
  getAssignees,
  getIssues,
  getIssuesByNumbers,
};
