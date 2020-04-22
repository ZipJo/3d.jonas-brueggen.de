angular.module('gsv')
.controller('MainCtrl', function($scope, gsvApiClient) {
  $scope.selectionBreakdown = generateSelectionBreakdown([]);
  $scope.files = [];
  $scope.handlePatternChange = selectFiles;
  $scope.loadingFiles = false;

  gulpVersion();
  allFiles();

  function startLoadingFiles() {
    $scope.loadingFiles = true;
  }

  function doneLoadingFiles() {
    $scope.loadingFiles = false;
  }

  function selectFiles(patterns) {
    startLoadingFiles();
    $scope.patterns = patterns;

    return gsvApiClient.files(patterns).then(function(selectedFiles) {
      markSelected($scope.files, selectedFiles);
      $scope.selectionBreakdown = generateSelectionBreakdown(selectedFiles);
    }).finally(doneLoadingFiles);
  }

  function gulpVersion() {
    return gsvApiClient.gulpVersion().then(function(version) {
      $scope.gulpVersion = version;
    });
  }

  function allFiles() {
    startLoadingFiles();

    var patterns = ['**', '!node_modules/**/*'];

    return gsvApiClient.files(patterns).then(function(files) {
      files.sort(byPath);
      $scope.files = files;
    }).finally(doneLoadingFiles);
  }

  function generateSelectionBreakdown(selectedFiles) {
    return selectedFiles.reduce(function(counts, selected) {
      counts.total += 1;

      if (selected.type == 'file') {
        counts.files += 1;
      } else if (selected.type == 'directory') {
        counts.directories += 1;
      }

      return counts;
    }, {files: 0, directories: 0, total: 0});
  }

  function markSelected(files, selectedFiles) {
    // make "is selected?" check easier
    var selectedPaths = selectedFiles.reduce(function(prev, curr) {
      prev[curr.path] = true;
      return prev;
    }, {});

    files.forEach(function(file) {
      file.selected = file.path in selectedPaths;
    });
  }

  function byPath(file1, file2) {
    return file1.path.localeCompare(file2.path);
  }
});