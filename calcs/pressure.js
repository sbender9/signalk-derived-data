const KELVIN = 273.15;

module.exports = function (app, plugin) {
	return {
	  group: 'pressure',
	  optionKey: 'Pressure Above Sea Level',
	  title: 'Outside air pressure at sea level',
	  derivedFrom: [
		'navigation.gnss.antennaAltitude',
		'environment.outside.temperature',
		'environment.outside.pressure'
	  ],
	  calculator: function (altitude = 0, temperature = 15 + KELVIN, pressure) {

		temperature = temperature - KELVIN;
		let pressureAboveSeaLevel = Math.round(pressure * Math.pow(1 - ((0.0065 * altitude) / (temperature + 0.0065 * altitude + KELVIN)), -5.257));

		return [{ path: 'environment.outside.pressure.ASL', value: pressureAboveSeaLevel }]
	  }
	}
  }
