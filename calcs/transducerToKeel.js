const _ = require('lodash')

module.exports = function (app) {
  return {
    group: 'depth',
    optionKey: 'transducerToKeel',
    title:
      'Transducer to keel (based on depth.surfaceToTransducer and design.draft.maximum)',
    derivedFrom: ['environment.depth.surfaceToTransducer'],
    calculator: function (surfaceToTransducer) {
      var draft = (draft = app.getSelfPath('design.draft.value.maximum'))

      if (
        typeof surfaceToTransducer !== 'number' ||
        typeof draft !== 'number'
      ) {
        return undefined
      }

	  const transducerToKeel = surfaceToTransducer - draft

      if (isNaN(transducerToKeel)) {
        return undefined
      }


      return [
        {
          path: 'environment.depth.transducerToKeel',
          value: transducerToKeel
        }
      ]
    }
  }
}
