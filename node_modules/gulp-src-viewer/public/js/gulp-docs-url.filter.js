angular.module('gsv')
.filter('gulpDocsUrl', function() {
  return function gulpDocsUrlFilter(incomingVersion) {
    if (!incomingVersion || incomingVersion == 'unknown') {
      // just link to latest docs
      return 'https://github.com/gulpjs/gulp/blob/master/docs/API.md';
    }

    var urlSegment;

    // version prefix => version to use in url
    var versionsByPrefix = {
      '3.4'  : '3.4',
      '3.5'  : '3.5',
      // there's no 3.6 tag in gh, maybe 3.5 docs are closest?
      '3.6'  : '3.5',
      '3.7'  : '3.7',
      '3.8.0': '3.8'
    };

    angular.forEach(versionsByPrefix, function(version, prefix) {
      if (incomingVersion.indexOf(prefix) == 0) {
        urlSegment = version;
      }
    });

    if (!urlSegment) {
      // from 3.8.1 and onward, the git tags are prefixed with 'v'
      urlSegment = 'v' + incomingVersion;
    }

    return 'https://github.com/gulpjs/gulp/blob/' + urlSegment + '/docs/API.md';
  }
});