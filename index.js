var clone = require('clone');

/**
 * Constants
 */

var CO2_PER_GALLON = 8.887; // Kilograms of CO2 burned per gallon of gasoline
var METERS_TO_MILES = 0.000621371;
var SECONDS_TO_HOURS = 1 / 60 / 60;

/**
 * Default factor values
 */

var DEFAULT_TIME_FACTORS = {
  bikeParking: 1,
  calories: -3,
  carParking: 5,
  co2: 0.5,
  cost: 5,
  transfer: 5
};

/**
 * Default costs
 */

var DEFAULT_RATES = {
  bikeSpeed: 4.1, // in m/s
  carParkingCost: 10,
  mileageRate: 0.56, // IRS reimbursement rate per mile http://www.irs.gov/2014-Standard-Mileage-Rates-for-Business,-Medical-and-Moving-Announced
  mpg: 21.4,
  walkSpeed: 1.4, // in m/s
  weight: 75 // in kilograms
};

/**
 * Expose `ProfileScore`
 */

module.exports = ProfileScore;

/**
 * Process & score an OTP Profile response. Tally statistics, score options
 */

function ProfileScore(opts) {
  opts = opts || {};

  this.factors = opts.factors || DEFAULT_TIME_FACTORS;
  this.rates = opts.rates || DEFAULT_RATES;
}

/**
 * Process a list of options
 */

ProfileScore.prototype.processOptions = function(options) {
  var id = 0;
  var processed = [];
  for (var i = 0; i < options.length; i++) {
    var o = options[i];

    // Split each option by access mode and score individually
    for (var j = 0; j < o.access.length; j++) {
      var opt = clone(o);
      opt.access = [opt.access[j]];
      processed.push(this.processOption(opt));
    }
  }

  processed.sort(function(a, b) {
    return a.score - b.score;
  });

  return processed;
};

/**
 * Process option, only uses the first access and egress modes given
 */

ProfileScore.prototype.processOption = function(o) {
  // Tally the data
  o = this.tally(o);

  // Score the option
  o.score = this.score(o);

  return o;
};

/**
 * Score the option
 */

ProfileScore.prototype.score = function(o) {
  var score = o.time;
  var totalCalories = 0;

  o.modes.forEach(function(mode) {
    switch (o.mode) {
      case 'car':
        // Add time for parking
        score += af(1, this.factors.carParking);

        // Add time for CO2 emissions
        score += af(o.emissions, this.factors.co2);
        break;
      case 'bicycle':
        // Add time for locking your bike
        score += af(1, this.factors.bikeParking);
        totalCalories += o.bikeCalories;
        break;
      case 'walk':
        totalCalories += o.walkCalories;
        break;
    }
  });

  // Add time for each transfer
  score += af(o.transfers, this.factors.transfer);

  // Add time for each dollar spent
  score += af(o.cost, this.factors.cost);

  // Add/subtract time for calories
  score += af(totalCalories, this.factors.calories);

  return score;
};

/**
 * Tally values
 */

ProfileScore.prototype.tally = function(o) {
  o.time = o.stats.avg / 60;

  // Defaults
  o.calories = 0;
  o.cost = 0;
  o.emissions = 0;
  o.modes = [];
  o.transfers = 0;

  // Bike/Drive/Walk distances
  o.bikeDistance = 0;
  o.driveDistance = 0;
  o.walkDistance = 0;

  // Tally access
  o.modes.push(o.access[0].mode.toLowerCase());
  switch (o.access[0].mode.toLowerCase()) {
    case 'car':
      o.driveDistance = walkStepsDistance(o.access[0]);

      o.carCost = this.rates.mileageRate * (o.driveDistance * METERS_TO_MILES) + this.rates.carParkingCost;
      o.cost += o.carCost;
      o.emissions = o.driveDistance / this.rates.mpg * CO2_PER_GALLON;
      break;
    case 'bicycle':
      o.bikeDistance = walkStepsDistance(o.access[0]);
      o.bikeCalories = bikeCal(this.rates.weight, (o.bikeDistance / this.rates.bikeSpeed) *
        SECONDS_TO_HOURS);
      break;
    case 'walk':
      o.walkDistance += walkStepsDistance(o.access[0]);
      break;
  }

  // Tally transit
  if (o.transit && o.transit.length > 0) {
    o.transitCost = 0;
    o.trips = Infinity;

    o.transit.forEach(function(segment) {
      if (segment.fares && segment.fares.length > 0)
        o.transitCost += segment.fares[0].peak;

      var mode = segment.mode.toLowerCase();
      if (o.modes.indexOf(mode) === -1) o.modes.push(mode);

      var trips = segment.segmentPatterns[0].nTrips;
      if (trips < o.trips) o.trips = trips;

      o.walkDistance += segment.walkDistance;
    });

    o.cost += o.transitCost;
  }

  // Tally egress
  if (o.egress && o.egress.length > 0) {
    if (o.modes.indexOf('walk') === -1) o.modes.push('walk');
    o.walkDistance += walkStepsDistance(o.egress[0]);
  }

  // Set the walking calories burned
  o.walkCalories = walkCal(this.rates.weight, (o.walkDistance / this.rates.walkSpeed) *
    SECONDS_TO_HOURS);

  // Total calories
  o.calories = o.bikeCalories + o.walkCalories;

  return o;
};

/**
 * Total Distance of Walk Steps
 */

function walkStepsDistance(o) {
  if (!o.walkSteps || o.walkSteps.length < 1) return 0;
  return o.walkSteps.reduce(function(distance, step) {
    return distance + step.distance;
  }, 0);
}

/**
 * Find MET scores here: http://appliedresearch.cancer.gov/atus-met/met.php
 *
 * Cycling: 8.0
 * Walking: 3.8
 */

function bikeCal(kg, hours) {
  return caloriesBurned(8.0, kg, hours);
}

function walkCal(kg, hours) {
  return caloriesBurned(3.8, kg, hours);
}

function caloriesBurned(met, kg, hours) {
  return met * kg * hours;
}

/**
 * Apply factor
 */

function af(v, f) {
  if (typeof f === 'function') {
    return f(v);
  } else {
    return f * v;
  }
}
