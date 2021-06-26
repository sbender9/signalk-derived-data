# signalk-derived-data

[![Greenkeeper badge](https://badges.greenkeeper.io/sbender9/signalk-derived-data.svg)](https://greenkeeper.io/)


Generates deltas for values derived from  signalk values

It currently calculates:

 * Outside air density (based on humidity, temperature and pressure)
 * Battery Power
 * Depth Below Keel (based on depth.belowSurface and design.draft.maximum)
 * Depth Below Keel (based on depth.belowTransducer and depth.transducerToKeel)
 * Depth Below Surface (based on depth.belowKeel and design.draft.maximum)
 * Distance To Go (based on courseGreatCircle.nextPoint.position)
 * Outside air dew point (based on humidity and temperature)
 * Fuel economy (based on speed over ground, fuel rate)
 * Propeller Slip calculation (requires defaults.json to include propulsion.\*.drive.propeller.pitch and propulsion.\*.transmission.gearRatio)  
 * Sets environment.sun to dawn, sunrise, day, sunset, dusk or night (based on navigation.datetime or system time and navigation.position)
 * Tank Volume (based on currentLevel (requires calibration pairs (>2 for parallell sides, >3 for straight wedge and >4 for more complex shapes))
 * Velocity Made Good to Course (based on courseGreatCircle.nextPoint.bearingTrue heading true and speedOverGround)
 * Velocity Made Good to wind (based on wind.directionTrue and speedOverGround)
 * Outside air wind chill (based on wind speed and temperature)
 * True Wind Angle, Direction and Speed (based on speed through water, AWA and AWS)
 * True Wind Direction (based on AWA and headingTrue)
 * Ground Wind Angle and Speed (based on SOG, AWA and AWS)
 * Magnetic Wind Direction (based on AWA and headingMagnetic)
 * Magnetic Wind Direction (based on wind.directionTrue and magneticVarition)
 * Wind Shift (experimental)
 * Moon illumination and times (based on time and navigation.position)
 * Sunlight Times: sunrise, sunriseEnd, goldenHourEnd, solarNoon, goldenHour, sunsetStart, sunset, dusk, nauticalDusk, night, nadir, nightEnd, nauticalDawn, dawn (based on time and navigation.position)
 * Outside Heat Index (based on temperature and humidity)
 * Pressure Above Sea Level

To add new calculations, just create a new file under the `./calcs` directory.

For example. This is the VMG calculator.

```
module.exports = function(app) {
  return {
    group: 'vmg',
    optionKey: 'vmg',
    title: "Velocity Made Goog (based on courseGreatCircle.nextPoint.bearingTrue heading true and speedOverGround)",
    derivedFrom: [ "navigation.courseGreatCircle.nextPoint.bearingTrue",
                   "navigation.headingTrue",
                   "navigation.speedOverGround" ],
    calculator: function (bearingTrue, headingTrue, speedOverGround)
    {
      var angle = Math.abs(bearingTrue-headingTrue)
      return [{ path: "navigation.courseGreatCircle.nextPoint.velocityMadeGood",
                value: Math.cos(bearingTrue-headingTrue) * speedOverGround}]
    }
  };
}
```
