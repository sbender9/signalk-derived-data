const LatLon = module.require('@panaaj/sk-geodesy/latlon-spherical')
  .LatLonSpherical

module.exports = function (app) {
  return {
    group: 'course data',
    optionKey: 'dtg',
    title:
      'Course DTG, XTE, BRG, etc (based on courseGreatCircle.nextPoint / previousPoint)',
    derivedFrom: [
      'navigation.courseGreatCircle.nextPoint.position',
      'navigation.courseGreatCircle.previousPoint.position',
      'navigation.position',
      'navigation.magneticVariation'
    ],
    calculator: function (
      nextPointPosition,
      previousPointPosition,
      vesselPosition,
      magneticVariation
    ) {
      let pos =
        vesselPosition && vesselPosition.latitude && vesselPosition.longitude
          ? new LatLon(vesselPosition.latitude, vesselPosition.longitude)
          : null

      let pathStart = previousPointPosition
        ? new LatLon(
          previousPointPosition.latitude,
          previousPointPosition.longitude
        )
        : null

      let pathEnd = nextPointPosition
        ? new LatLon(nextPointPosition.latitude, nextPointPosition.longitude)
        : null

      // ** Cross track Error **
      let xte =
        !pos || !pathStart || !pathEnd
          ? null
          : pos.crossTrackDistanceTo(pathStart, pathEnd)

      // The bearing of a line between previousPoint and nextPoint, relative to true north.
      let trkBearingTrue =
        !pos || !pathStart || !pathEnd
          ? null
          : pathStart.initialBearingTo(pathEnd)

      // Same as above, but magnetic
      let trkBearingMagnetic =
          !trkBearingTrue || !magneticVariation
          ? null
          : trkBearingTrue - magneticVariation

      // ** Distance from vessel to nextPoint **
      let dtg = !pos || !pathEnd ? null : pos.distanceTo(pathEnd)

      // The bearing of a line between the vessel's current position and nextPoint, relative to true north
      let brg = !pos || !pathEnd ? null : pos.initialBearingTo(pathEnd)

      // Same as above, but magnetic
      let brgMag =
          !brg || !magneticVariation
              ? null
              : brg - magneticVariation

      // ** Distance from vessel to previousPoint **
      let dtp = !pos || !pathStart ? null : pathStart.distanceTo(pos)

      return [
        {
          path: 'navigation.courseGreatCircle.crossTrackError',
          value: xte
        },
        {
          path: 'navigation.courseGreatCircle.bearingTrackTrue',
          value: trkBearingTrue
        },
        {
          path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
          value: trkBearingMagnetic
        },
        {
          path: 'navigation.courseGreatCircle.nextPoint.distance',
          value: dtg
        },
        {
          path: 'navigation.courseGreatCircle.nextPoint.bearingTrue',
          value: brg
        },
        {
          path: 'navigation.courseGreatCircle.nextPoint.bearingMagnetic',
          value: brgMag
        },
        {
          path: 'navigation.courseGreatCircle.previousPoint.distance',
          value: dtp
        }
      ]
    }
  }
}
