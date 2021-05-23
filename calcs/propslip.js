const _ = require('lodash')

module.exports = function (app, plugin) {
  return plugin.engines.map(instance => {
    return {
      group: 'propulsion',
      optionKey: 'propslip' + instance,
      title:
        'propulsion.' +
        instance +
        '.slip (based on RPM, propulsion.' +
        instance +
        '.transmission.gearRatio and propulsion.' +
        instance +
        '.drive.propeller.pitch)',
      derivedFrom: function () {
        return [
          'propulsion.' + instance + '.revolutions',
          'navigation.speedThroughWater'
        ]
      },
      calculator: function (revolutions, stw) {
        var gearRatio = app.getSelfPath(
          'propulsion.' + instance + '.transmission.gearRatio.value'
        )
        var pitch = app.getSelfPath(
          'propulsion.' + instance + '.drive.propeller.pitch.value'
        )
        
        if(revolutions > 0.0){
          slip = 1.0 - stw * gearRatio / (revolutions * pitch)
        }else{
          slip = 1.0
        } 

        return [
          {
            path: 'propulsion.' + instance + '.drive.propeller.slip',
            value: slip
          }
        ]
      }
    }
  })
}
