angular.module('gsv')
.directive('codeBox', function() {
  return {
    restrict: 'E',
    scope: {
      patterns: '='
    },
    controller: function($scope) {
      var quote = "'";
      var indent = "  ";

      $scope.singleQuote = setQuoteStyle.bind(null, "'");
      $scope.doubleQuote = setQuoteStyle.bind(null, '"');

      function setQuoteStyle(quoteStyle) {
        quote = quoteStyle;
        updateCode($scope.patterns);
      }

      $scope.$watch('patterns', updateCode, 'deep');

      function updateCode(patterns) {
        if (!patterns) return;

        var front = '\nvar globs = [\n';
        var middle = patterns.map(function(pattern, index) {
          return indent + quote + pattern + quote;
        }).join(',\n');
        var end = '\n]\n';

        $scope.code = front + middle + end;
      }
    },
    // template is embedded in index.html
    templateUrl: 'code-box'
  };
});