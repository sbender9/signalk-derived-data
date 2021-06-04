module.exports = function (app, plugin) {
  return {
    group: 'heading',
    optionKey: 'leewayAngle',
    title: 'Leeway (based on heading and COG). Always positive value.',
    derivedFrom: [
      'navigation.headingMagnetic',
      'navigation.courseOverGroundTrue'
    ],
    calculator: function (hdg, cog) {
      var leewayAngle = Math.abs(hdg - cog) + Math.PI / 2

      const meta = [
        {
          path: 'performance.leeway',
          value: {
            units: 'rad',
            description:
              'Leeway angle, based on heading and COG. Always positive',
            displayName: 'Leeway angle',
            shortName: 'Leeway angle'
          }
        }
      ]

      const values = [
        {
          path: 'performance.leeway',
          value: leewayAngle
        }
      ]

      toreturn = {
        values: values,
        meta: meta
      }

      // app.debug('result of leeway calc + meta: ', JSON.stringify(toreturn))
      return toreturn
    }
  }
}
