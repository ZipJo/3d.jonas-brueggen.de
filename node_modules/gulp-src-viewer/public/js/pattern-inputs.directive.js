angular.module('gsv')
.directive('patternInputs', function() {
  return {
    restrict: 'E',
    scope: {
      onPatternChange: '&'
    },
    controller: function($scope) {
      $scope.ngModelOptions = {
        // milliseconds
        debounce: 200
      };

      $scope.patterns = [newPattern()];
      $scope.handleKey = handleKey;
      $scope.moveUp = moveUp;
      $scope.moveDown = moveDown;
      $scope.remove = remove;
      $scope.add = addPatternToBack;
      $scope.globInputFocused = globInputFocused;
      $scope.globInputBlurred = globInputBlurred;

      $scope.$watch('patterns', patternsChanged, 'deep');

      focusInput(0);

      function globInputFocused() {
        $scope.showProtips = true;
      }

      function globInputBlurred() {
        $scope.showProtips = false;
      }

      function patternsChanged(newValue, oldValue) {
        if (newValue !== oldValue) {
          var patterns = newValue.map(function(patternObject) {
            return patternObject.value;
          });

          $scope.onPatternChange({patterns: patterns});
        }
      }

      function addPatternToBack() {
        addPattern(patternCount() - 1);
        focusInput(patternCount() - 1);
      }

      function moveUp(index) {
        movePattern(index, index - 1);
      }

      function moveDown(index) {
        movePattern(index, index + 1);
      }

      function remove(index) {
        if (patternCount() > 1) {
          removePattern(index);
        }
      }

      function handleKey(event, index) {
        var handler = {
          8: handleBackspaceKey,
          13: handleEnterKey
        }[event.keyCode];

        handler && handler(index);
      };

      function handleEnterKey(index) {
        addPattern(index);
        focusInput(index + 1);
      }

      function handleBackspaceKey(index) {
        if (hasEmptyPatternAt(index)) {
          remove(index);
          focusInput(index - 1);
        }
      }

      function focusInput(index) {
        if (index < 0) {
          index = 0;
        }

        // HackCity 3000
        setTimeout(function() {
          document.getElementById('pattern-' + index).focus();
        }, 0)
      }

      function hasEmptyPatternAt(index) {
        return $scope.patterns[index].value.length == 0;
      }

      function addPattern(afterIndex) {
        $scope.patterns.splice(afterIndex + 1, 0, newPattern());
      }

      function newPattern() {
        return {
          value: ''
        };
      }

      function patternCount() {
        return $scope.patterns.length;
      }

      function movePattern(fromIndex, toIndex) {
        if (isValidIndex(toIndex)) {
          var mover = removePattern(fromIndex);
          insertPattern(toIndex, mover);
        }
      }

      // assumes index is valid
      function insertPattern(index, pattern) {
        $scope.patterns.splice(index, 0, pattern);
      }

      // assumes index is valid, returns removed pattern
      function removePattern(index) {
        return $scope.patterns.splice(index, 1)[0];
      }

      function isValidIndex(index) {
        return index >= 0 && index < patternCount();
      }
    },
    // template is embedded in index.html
    templateUrl: 'pattern-inputs'
  };
});