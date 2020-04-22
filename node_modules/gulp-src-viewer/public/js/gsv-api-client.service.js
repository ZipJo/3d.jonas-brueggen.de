angular.module('gsv')
.factory('gsvApiClient', function($http) {
  return {
    gulpVersion: gulpVersion,
    files: files
  };

  function gulpVersion() {
    return $http.get('/gulp/version').then(function(response) {
      return response.data.version;
    });
  }

  function files(globs) {
    if (typeof globs == 'string') {
      globs = [globs];
    }

    return $http.post('/files', globs).then(function(response) {
      return response.data;
    });
  }
});