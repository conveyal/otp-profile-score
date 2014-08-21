
# otp-profile-score

[![NPM version][npm-image]][npm-url]
[![Latest tag][github-tag]][github-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]

[npm-image]: https://img.shields.io/npm/v/otp-profile-score.svg?style=flat-square
[npm-url]: https://npmjs.org/package/otp-profile-score
[github-tag]: http://img.shields.io/github/tag/conveyal/otp-profile-score.svg?style=flat-square
[github-url]: https://github.com/conveyal/otp-profile-score/tags
[travis-image]: https://img.shields.io/travis/conveyal/otp-profile-score.svg?style=flat-square
[travis-url]: https://travis-ci.org/conveyal/otp-profile-score
[coveralls-image]: https://img.shields.io/coveralls/conveyal/otp-profile-score.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/conveyal/otp-profile-score?branch=master
[david-image]: http://img.shields.io/david/conveyal/otp-profile-score.svg?style=flat-square
[david-url]: https://david-dm.org/conveyal/otp-profile-score

Score OTP journey profiles.

## Installation

Install with [component(1)](http://component.io):

```bash
$ component install conveyal/otp-profile-score
```

Install with NPM

```bash
$ npm install otp-profile-score
```

## API

```js
var Scorer = require('otp-profile-score');
var scorer = new Scorer;

// Get a profile from OTP
var options = scorer.processOptions(otpProfileOptions);
```

## License

The MIT License (MIT)
