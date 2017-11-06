const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const github = require('./lib/github');
const zenhub = require('./lib/zenhub');

app.get('/api/repos', (req, res, next) => {
  github.getRepos().then((repos) => {
    res.json(repos.map((repo) => {
      return {name: repo.name, id: repo.id}
    }));
  });
});
app.get('/api/milestones', (req, res, next) => {
  github.getMilestones(req.query.repo).then((milestones) => {
    res.json(milestones.map((milestone) => { return {name: milestone.title, number: milestone.number } }));
  });
});
app.get('/api/labels', (req, res, next) => {
  github.getLabels(req.query.repo).then((labels) => {
    res.json(labels.map((label) => label.name));
  });
});
app.get('/api/assignees', (req, res, next) => {
  github.getAssignees(req.query.repo).then((assignees) => {
    res.json(assignees.map((assignee) => assignee.login));
  });
});
app.get('/api/pipelines', (req, res, next) => {
  zenhub.getBoardData(req.query.repo).then((pipelines) => {
    res.json(pipelines.map((pipeline) => pipeline.name));
  });
});
app.get('/api/issues', (req, res, next) => {
  console.log(req.query);
  const repo = req.query.repo;
  const repoId = req.query.repoId;
  const filter = {
    state: req.query.state,
  };
  if (req.query.label !== 'all') {
    filter.labels = req.query.label;
  }
  if (req.query.author !== 'all') {
    filter.creator = req.query.author;
  }
  if (req.query.assignee !== 'all') {
    filter.assignee = req.query.assignee;
  }
  if (req.query.milestone !== 'all') {
    filter.milestone = req.query.milestone;
  }
  console.log(filter);

  const process = (issues) => {
    console.log(issues);
    console.log(issues.length);
    const randomFileName = Math.random(100).toString().replace('.','') + '.csv';
    const header = 'Git Id,Issue title,Pipeline,Milestone,Story Points,Assignee,Labels,Issue State\n';
    const body = issues.map((issue) => {
      const assignee = (issue.assignee && issue.assignee.login) ? issue.assignee.login : 'No Assignee';
      const milestone = (issue.milestone && issue.milestone.title) ? issue.milestone.title : 'No Milestone';
      let labels = issue.labels.map((label) => label.name).join(';');
      if(labels === '') labels = 'No labels';
      let estimate;
      if(issue.zenhubData.estimate){
        estimate = issue.zenhubData.estimate.value;
      } else if (issue.state === 'closed') {
        estimate = 'NA';
      } else {
        estimate = 'No estimate';
      }
      let pipeline;
      if(issue.zenhubData.pipeline){
        pipeline = issue.zenhubData.pipeline;
      } else if (issue.state === 'closed') {
        pipeline = 'Closed';
      } else {
        pipeline = 'No Pipeline';
      }
      return [issue.number, issue.title, pipeline, milestone, estimate, assignee, labels, issue.state ].join(',');
    });
    const content = header + body.join('\n');
    fs.writeFileSync(path.join(__dirname, 'tmp', randomFileName), content);
    res.download(path.join(__dirname, 'tmp', randomFileName));
  };

  const filterIssues = (issues) => {
    return issues
      .filter((issue) => {
        if(!filter.milestone) return true;
        if(!issue.milestone) return false;
        return issue.milestone.number == filter.milestone;
      })
      .filter((issue) => {
        if(!filter.creator) return true;
        return issue.user.login === filter.creator
      })
      .filter((issue) => {
        if(filter.state === 'all') return true;
        return issue.state === filter.state;
      })
      .filter((issue) => {
        if(!filter.labels) return true;
        if(!issue.labels) return false;
        return issue.labels.filter((label) => label.name === filter.labels).length > 0
      })
      .filter((issue) => {
        if(!filter.assignee) return true;
        if(!issue.assignee) return false;
        return issue.assignees.filter((assignee) => assignee.login === filter.assignee).length > 0
      })
  };

  const zenhubData = {};

  const attachZenhubData = (issues) => {
    return issues.map((issue) => {
      issue.zenhubData = zenhubData[issue.number] || {};
      return issue;
    })
  };

  zenhub.getBoardData(repoId).then((pipelines) => {
    pipelines.forEach((pipeline) => {
      pipeline.issues.forEach((issue) => {
        zenhubData[issue.issue_number] = issue;
        zenhubData[issue.issue_number].pipeline = pipeline.name;
      })
    });
    if (req.query.pipeline !== 'all') {
      const pipelineIssues = pipelines.filter((pipeline) => {
        return pipeline.name === req.query.pipeline;
      })[0].issues;
      console.log(pipelineIssues);
      const issueNumbers = pipelineIssues.map((issue) => issue.issue_number);
      github.getIssuesByNumbers(repo, issueNumbers)
        .then(filterIssues)
        .then(attachZenhubData)
        .then(process);
      return;
    }
    github.getIssues(repo, filter).then(attachZenhubData).then(process);
  });
});

app.use(express.static('client'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));