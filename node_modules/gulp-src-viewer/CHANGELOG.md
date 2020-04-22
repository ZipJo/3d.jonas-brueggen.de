# Change Log

All notable changes to this project will be documented in this file.

## [1.2.3] - 2015-09-19

### Fixed

- IE bug where two glob inputs are added when enter pressed

## [1.2.2] - 2015-08-29

### Fixed

- Flexbox issues in IE

## [1.2.1] - 2015-08-22

### Added

- title on webpage that is lauched

## [1.2.0] - 2015-08-22

### Added

- Buttons to add/move/remove globs

### Changed

- Pattern inputs are debounced
- Dependency on `faye` removed. Using `express` for everything now.

### Fixed

- Fix link to `gulp.src` docs for most versions of gulp, 3.4 and newer

## [1.1.0] - 2015-08-16

### Added

- Show copy-able pattern code based on current patterns
- Show gulp version and link to docs

### Changed

- Run `gulp.src` with option `{read: false}` because we don't look at file contents

### Removed

- Code-like text around pattern inputs

## [1.0.0] - 2015-08-16
