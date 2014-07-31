/**
 * Constants
 */

var CO2_PER_GALLON = 8.887; // Kilograms of CO2 burned per gallon of gasoline
var METERS_TO_MILES = 0.000621371;
var MINUTE = 60;

/**
 * Default factor values
 */

var DEFAULT_TIME_FACTORS = {
  bikeParking: 1,
  calories: 3,
  carParking: 5,
  co2: 0.5,
  cost: 5,
  transfer: 5
};

/**
 * Default costs
 */

var DEFAULT_RATES = {
  calsBiking: 10,
  calsWalking: 4.4,
  carParkingCost: 10,
  mileageRate: 0.56, // IRS reimbursement rate per mile http://www.irs.gov/2014-Standard-Mileage-Rates-for-Business,-Medical-and-Moving-Announced
  mpg: 21.4
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
  this.transform = opts.transform || function(_){ return _; };
}

/**
 * Process a list of options
 */

ProfileScore.prototype.processOptions = function(options) {
  for (var i = 0; i < options.length; i++) {
    // Add an id
    options[i].id = 'option_' + i;
    options[i] = this.processOption(options[i]);
  }

  options.sort(function(a, b) {
    return a.score - b.score;
  });

  return options;
};

/**
 * Process option
 */

ProfileScore.prototype.processOption = function(o) {
  // Tally the data
  o = this.tally(o);

  // Score the option
  o.score = this.score(o);

  // Apply transformation and return
  return this.transform(o);
};

/**
 * Score the option
 */

ProfileScore.prototype.score = function(o) {
  var score = o.time;

  switch (o.mode) {
    case 'car':
      // Add time for parking
      score += this.factors.carParking;
      break;
    case 'bicycle':
      // Add time for locking your bike
      score += this.factors.bikeParking;
      break;
    case 'walk':

      break;
    default: // Transit only

      break;
  }

  // Add time for each transfer
  score += o.transfers * this.factors.transfer;

  // Add time for each dollar spent
  score += o.totalCost * this.factors.cost;

  // Subtract time for calories burned
  score -= o.calories * this.factors.calories;

  // Add time for CO2 emissions (or add negative val for bike/walking offset)
  score += o.emissions * this.factors.co2;

  return score;
};

/**
 * Tally values
 */

ProfileScore.prototype.tally = function(o) {
  o.time = o.stats.avg / MINUTE;
  o.calories = 0;
  o.totalCost = totalFare(o);
  o.totalDistance = walkStepsDistance(o);
  o.transfers = o.segments.length;

  // Set emissions for all, will show negative for bike/walk/transit
  o.emissions = -o.totalDistance / this.rates.mpg * CO2_PER_GALLON;

  // Set the primary mode
  o.mode = o.summary.length < 8 ? o.summary.toLowerCase() : primaryMode(o);

  switch (o.mode) {
    case 'car':
      o.emissions = -o.emissions;
      o.totalCost += this.rates.mileageRate * o.totalDistance + this.rates.carParkingCost;
      break;
    case 'bicycle':
      o.calories = this.rates.calsBiking * o.time;
      break;
    case 'walk':
      o.calories = this.rates.calsWalking * o.time;
      break;
    default: // Transit only for now
      o.calories = transitCals(o, this.rates.calsWalking);
      break;
  }

  return o;
};

/**
 * Transit Walking Segment Cals
 */

function transitCals(o, calsWalking) {
  return o.segments.reduce(function(calories, segment) {
    return calories + calsWalking * (segment.walkTime / MINUTE);
  }, 0) + calsWalking * (o.finalWalkTime / MINUTE);
}

/**
 * Total Distance of Walk Steps
 */

function walkStepsDistance(o) {
  if (!o.walkSteps || o.walkSteps.length < 1) return 0;
  return METERS_TO_MILES * o.walkSteps.reduce(function(distance, step) {
    return distance + step.distance;
  }, 0);
}

/**
 * Calculate the total fare
 */

function totalFare(o) {
  if (!o.fares || o.fares.length < 1) return 0;
  return o.fares.reduce(function(total, fare) {
    return total + fare.peak;
  }, 0);
}

/**
 * Get primary mode
 */

function primaryMode(o) {
  var max = -Infinity;
  var mode = '';

  for (var i = 0; i < o.segments.length; i++) {
    var time = o.segments[i].waitStats.avg + o.segments[i].rideStats.avg;
    if (time > max) mode = o.segments[i].mode.toLowerCase();
  }

  return mode;
}

/**
 * Get the frequency of a transit option
 */

function frequency(o, timeWindow) {
  var patterns = o.segments.reduce(function(memo, segment) {
    return memo.concat(segment.segmentPatterns);
  }, []);

  return patterns.reduce(function(memo, pattern) {
    var nTrips = timeWindow / pattern.nTrips;
    if (nTrips < memo) return nTrips;
    else return memo;
  }, Infinity);
}
