// calculation source: https://arvelgentry.jimdo.com/app/download/9157993883/Arvel+Gentry+-+Sailboat_Performance_Testing_Techniques.pdf?t=1485748085
module.exports = function (app, plugin) {
  return {
    group: 'heading',
    optionKey: 'leewayAngle',
    title: 'Leeway (based on heading and COG)',
    derivedFrom: [
      'navigation.headingMagnetic',
      'navigation.courseOverGroundTrue'
    ],
    calculator: function (hdg, cog) {
      var leewayAngle = Math.abs(hdg - cog)
      // app.debug("leeway angle: " + leewayAngle);
      return [{ path: 'performance.leeway', value: leewayAngle }]
    }
  }
}
