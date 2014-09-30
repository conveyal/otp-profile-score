var assert = require('assert');
var data = require('./profile.json');
var Scorer = require('..');

describe('OTP Profile Score', function() {
  describe('constructor', function() {
    it('should have default rates and factors', function() {
      var scorer = new Scorer();
      assert(scorer.factors !== undefined);
      assert(scorer.rates !== undefined);
    });

    it('should override default rates and factors with passed in values',
      function() {
        var scorer = new Scorer({
          factors: {
            bikeParking: 2
          },
          rates: {
            bikeSpeed: 5
          }
        });

        assert(scorer.factors.bikeParking === 2);
        assert(scorer.rates.bikeSpeed === 5);
        assert(scorer.factors.calories === -0.01);
      });
  });

  describe('processOption', function() {
    it('should tally and score an option', function() {
      var scorer = new Scorer();
      var option = scorer.processOption(data.options[0]);
      assert(option.score === 37.955000000000005, option.score);
    });

    it('should handle factors as functions', function() {
      var scorer = new Scorer({
        factors: {
          calories: function(c) {
            if (c > 100) return 0;
            else return c * -0.01;
          }
        }
      });
      var option = scorer.processOption(data.options[0]);
      assert(option.score === 41.95, option.score);
    });
  });

  describe('processOptions', function() {
    it('should tally and score all access modes for all options', function() {
      var scorer = new Scorer();
      var options = scorer.processOptions(data.options);
      assert(options.length === 12, options.length);

      for (var i = 0; i < options.length; i++) {
        assert(options[i].score !== undefined);
        assert(!isNaN(options[i].score));
      }
    });
  });
});
