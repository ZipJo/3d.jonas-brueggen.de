angular.module('gsv')
.directive('selectionBreakdown', function() {
  return {
    restrict: 'E',
    scope: {
      breakdown: '='
    },
    // template is embedded in index.html
    templateUrl: 'selection-breakdown'
  };
});