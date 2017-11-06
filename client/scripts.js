$(document).ready(() => {
  // const baseUrl = 'http://localhost:'
  // $($('#repoSelect').closest('div').next('div').find('label')).html('Fetching repos for organization...');
  $($('#repoSelect').closest('div').next('div').find('label')).html('Fetching repos for organization...');
  $.ajax('/api/repos').done((data) => {
    console.log(data);
    $.each(data, function(key, value) {
      $('#repoSelect').append($("<option/>", {
        value: value.name,
        'data-id': value.id,
        text: value.name
      }));
    });
    $($('#repoSelect').closest('div').next('div').find('label')).html('');
  });

  $('#repoSelect').on('change', function() {
    if(this.value === 'all'){
      $($('#repoSelect').closest('div').next('div').find('label')).html('Please select a valid repo..!');
      return;
    }else{
      $($('#repoSelect').closest('div').next('div').find('label')).html('');
    }
    //clear previous fields
    $('#milestoneSelect').empty();
    $('#labelSelect').empty();
    $('#assigneeSelect').empty();
    $('#authorSelect').empty();
    $('#pipelineSelect').empty();
    $('#milestoneSelect').append('<option value="all">All</option>');
    $('#labelSelect').append('<option value="all">All</option>');
    $('#assigneeSelect').append('<option value="all">All</option>');
    $('#authorSelect').append('<option value="all">All</option>');
    $('#pipelineSelect').append('<option value="all">All</option>');

    $($('#milestoneSelect').closest('div').next('div').find('label')).html('Fetching milestones for ' + this.value + '...');
    $($('#labelSelect').closest('div').next('div').find('label')).html('Fetching labels for ' + this.value + '...');
    $($('#assigneeSelect').closest('div').next('div').find('label')).html('Fetching assignees for ' + this.value + '...');
    $($('#authorSelect').closest('div').next('div').find('label')).html('Fetching authors for ' + this.value + '...');
    $($('#pipelineSelect').closest('div').next('div').find('label')).html('Fetching pipelines for ' + this.value + '...');

    //fetch milestones
    $.ajax('/api/milestones?repo=' + this.value).done((data) => {
      console.log(data);
      $.each(data, function(key, value) {
        $('#milestoneSelect').append($("<option/>", {
          value: value.number,
          text: value.name
        }));
      });
      $($('#milestoneSelect').closest('div').next('div').find('label')).html('');
    });

    //fetch labels
    $.ajax('/api/labels?repo=' + this.value).done((data) => {
      console.log(data);
      $.each(data, function(key, value) {
        $('#labelSelect').append($("<option/>", {
          value: value,
          text: value
        }));
      });
      $($('#labelSelect').closest('div').next('div').find('label')).html('');
    });

    //fetch assignees
    $.ajax('/api/assignees?repo=' + this.value).done((data) => {
      console.log(data);
      $.each(data, function(key, value) {
        $('#assigneeSelect').append($("<option/>", {
          value: value,
          text: value
        }));
        $('#authorSelect').append($("<option/>", {
          value: value,
          text: value
        }));
        $($('#assigneeSelect').closest('div').next('div').find('label')).html('');
        $($('#authorSelect').closest('div').next('div').find('label')).html('');
      });
    });

    //fetch pipelines
    $.ajax('/api/pipelines?repo=' + $(this[this.selectedIndex]).attr('data-id')).done((data) => {
      console.log(data);
      $.each(data, function(key, value) {
        $('#pipelineSelect').append($("<option/>", {
          value: value,
          text: value
        }));
      });
      $($('#pipelineSelect').closest('div').next('div').find('label')).html('');
    });
  });

  $('#formSubmitButton').on('click', function(){
    const repo = $('#repoSelect').val();
    if(repo === 'all'){
      $($('#repoSelect').closest('div').next('div').find('label')).html('Please select a valid repo..!');
      return;
    }
    $($('#formSubmitButton').closest('div').next('div').find('label')).html('Download will start in few secs...');

    const repoId = $('#repoSelect').find(":selected").data('id');
    const milestone = $('#milestoneSelect').val();
    const label = $('#labelSelect').val();
    const author = $('#authorSelect').val();
    const assignee = $('#assigneeSelect').val();
    const state = $('#issueStateSelect').val();
    const pipeline = $('#pipelineSelect').val();

    let qs = `?repo=${repo}&repoId=${repoId}&milestone=${milestone}&label=${label}&author=${author}&assignee=${assignee}&state=${state}&pipeline=${pipeline}`;
    const url = '/api/issues' + qs;
    // $.ajax(url).done((data) => {
    //   console.log(data);
    //   console.log('done...');
    // });

    function xml2(){
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.responseType = "blob";

      req.onload = function (event) {
        var blob = req.response;
        console.log(blob.size);
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'issues.csv';
        link.click();
        $($('#formSubmitButton').closest('div').next('div').find('label')).html('');
      };
      req.send();
    }
    xml2();

    console.log(repo);
    console.log(milestone);
    console.log(label);
    console.log(author);
    console.log(assignee);
    console.log(state);
    console.log(pipeline);
  })
});