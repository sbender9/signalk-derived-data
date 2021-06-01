/*
 * Copyright 2017 Scott Bender <scott@scottbender.net>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Bacon = require('baconjs')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')

const defaultEngines = 'port, starboard'
const defaultBatteries = '0'
const defaultTanks = 'fuel.0, fuel.1'
const defaultAir = 'outside'

module.exports = function (app) {
  var plugin = {}
  var unsubscribes = []
  var schema
  var uiSchema
  var calculations

  plugin.start = function (props) {
    plugin.properties = props

    if (!plugin.properties.engine_instances) {
      plugin.properties.engine_instances = defaultEngines
    }
    if (!plugin.properties.battery_instances) {
      plugin.properties.battery_instances = defaultBatteries
    }
    if (!plugin.properties.tank_instances) {
      plugin.properties.tank_instances = defaultTanks
    }
    if (!plugin.properties.air_instances) {
      plugin.properties.air_instances = defaultAir
    }
    if (!plugin.properties.traffic.notificationZones) {
      plugin.properties.traffic.notificationZones = []
    }
    updateOldTrafficConfig()
    plugin.engines = plugin.properties.engine_instances
      .split(',')
      .map(e => e.trim())
    plugin.batteries = plugin.properties.battery_instances
      .split(',')
      .map(e => e.trim())
    plugin.tanks = plugin.properties.tank_instances
      .split(',')
      .map(e => e.trim())
    plugin.air = plugin.properties.air_instances.split(',').map(e => e.trim())
    calculations = load_calcs(app, plugin, 'calcs')
    calculations = [].concat.apply([], calculations)

    calculations.forEach(calculation => {
      if (calculation.group) {
        if (
          !props[calculation.group] ||
          !props[calculation.group][calculation.optionKey]
        ) {
          return
        }
      } else if (!props[calculation.optionKey]) {
        return
      }

      var derivedFrom

      if (typeof calculation.derivedFrom === 'function') {
        derivedFrom = calculation.derivedFrom()
      } else derivedFrom = calculation.derivedFrom

      var skip_function
      if (
        (typeof calculation.ttl !== 'undefined' && calculation.ttl > 0) ||
        props.default_ttl > 0
      ) {
        // app.debug("using skip")
        skip_function = function (before, after) {
          var tnow = new Date().getTime()
          if (_.isEqual(before, after)) {
            // values are equial, but should we emit the delta anyway.
            // This protects from a sequence of changes that produce no change from
            // generating events, but ensures events are still generated at
            // a default rate. On  Pi Zero W, the extra cycles reduce power consumption.
            if (calculation.nextOutput > tnow) {
              // console.log("Rejected dupilate ", calculation.nextOutput - tnow);
              return true
            }
            // console.log("Sent dupilate ", calculation.nextOutput - tnow);
          }

          var ttl =
            typeof calculation.ttl === 'undefined'
              ? props.default_ttl
              : calculation.ttl
          // app.debug("ttl: " + ttl, "def: " + props.default_ttl)

          calculation.nextOutput = tnow + ttl * 1000
          // console.log("New Value ----------------------------- ", before, after);
          return false
        }
      } else {
        skip_function = function (before, after) {
          return false
        }
      }

      const selfStreams = derivedFrom.map((key, index) => {
        let stream
        /*
        if ( !_.isUndefined(calculation.allContexts) && calculation.allContexts ) {
          stream = app.streambundle.getBus(key)
        } else {
        */
        stream = app.streambundle.getSelfStream(key)
        /* } */
        if (calculation.defaults && calculation.defaults[index] != undefined) {
          stream = stream.merge(Bacon.once(calculation.defaults[index]))
        }
        return stream
      }, app.streambundle)

      unsubscribes.push(
        Bacon.combineWith(calculation.calculator, selfStreams)
          .changes()
          .debounceImmediate(calculation.debounceDelay || 20)
          .skipDuplicates(skip_function)
          .onValue(values => {
            if (typeof values !== 'undefined' && values.length > 0) {
              if (values[0].context) {
                values.forEach(delta => {
                  app.handleMessage(plugin.id, delta)
                })
              } else {
                let delta = {
                  context: 'vessels.' + app.selfId,
                  updates: [
                    {
                      values: values
                    }
                  ]
                }

                // app.debug("got delta: " + JSON.stringify(delta))
                app.handleMessage(plugin.id, delta)
              }
            }
          })
      )
    })
  }

  plugin.stop = function () {
    unsubscribes.forEach(f => f())
    unsubscribes = []

    if (calculations) {
      calculations.forEach(calc => {
        if (calc.stop) {
          calc.stop()
        }
      })
    }
  }

  plugin.id = 'derived-data'
  plugin.name = 'Derived Data'
  plugin.description = 'Plugin that derives data'

  plugin.schema = function () {
    updateSchema()
    return schema
  }

  plugin.uiSchema = function () {
    updateSchema()
    return uiSchema
  }

  function updateSchema () {
    if (!calculations) {
      plugin.engines = defaultEngines.split(',').map(e => e.trim())
      plugin.batteries = defaultBatteries.split(',').map(e => e.trim())
      plugin.tanks = defaultTanks.split(',').map(e => e.trim())
      plugin.air = defaultAir.split(',').map(e => e.trim())

      calculations = load_calcs(app, plugin, 'calcs')
      calculations = [].concat.apply([], calculations)
    }

    schema = {
      title: 'Derived Data',
      type: 'object',
      properties: {
        default_ttl: {
          title: 'Default TTL',
          type: 'number',
          description:
            "The plugin won't send out duplicate calculation values for this time period (s) (0=no ttl check)",
          default: 0
        },
        engine_instances: {
          title: 'Engines',
          type: 'string',
          description: 'Comma delimited list of available engines',
          default: defaultEngines
        },
        battery_instances: {
          title: 'Batteries',
          type: 'string',
          description: 'Comma delimited list of available batteries',
          default: defaultBatteries
        },
        tank_instances: {
          title: 'Tanks',
          type: 'string',
          description: 'Comma delimited list of available tanks',
          default: defaultTanks
        },
        air_instances: {
          title: 'Air',
          type: 'string',
          description: 'Comma delimited list of available air areas',
          default: defaultAir
        }
      }
    }

    uiSchema = {
      'ui:order': [
        'default_ttl',
        'engine_instances',
        'battery_instances',
        'tank_instances',
        'air_instances'
      ]
    }

    var groups = {}

    calculations.forEach(calc => {
      var groupName

      if (typeof calc.group !== 'undefined') {
        groupName = calc.group
      } else {
        groupName = 'nogroup'
      }

      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(calc)
    })

    if (groups.nogroup) {
      groups.nogroup.forEach(calc => {
        uiSchema['ui:order'].push(calc.optionKey)
        schema.properties[calc.optionKey] = {
          title: calc.title,
          type: 'boolean',
          default: false
        }
        if (calc.properties) {
          var props =
            typeof calc.properties === 'function'
              ? calc.properties()
              : calc.properties
          _.extend(schema.properties, props)
        }
      })
    }

    _.keys(groups).forEach(groupName => {
      if (groupName != 'nogroup') {
        uiSchema['ui:order'].push(groupName)
        uiSchema[groupName] = {
          'ui:order': [],
          'ui:field': 'collapsible',
          collapse: {
            field: 'ObjectField',
            wrapClassName: 'panel-group'
          }
        }
        var group = {
          title: groupName.charAt(0).toUpperCase() + groupName.slice(1),
          type: 'object',
          properties: {}
        }
        groups[groupName].forEach(calc => {
          var order = uiSchema[groupName]['ui:order']
          order.push(calc.optionKey)
          group.properties[calc.optionKey] = {
            title: calc.title,
            type: 'boolean',
            default: false
          }
          if (calc.properties) {
            var props =
              typeof calc.properties === 'function'
                ? calc.properties()
                : calc.properties
            _.extend(group.properties, props)
            _.keys(props).forEach(key => {
              order.push(key)
            })
          }
        })
        schema.properties[groupName] = group
      }
    })

    // app.debug('schema: ' + JSON.stringify(schema, null, 2))
    // app.debug('uiSchema: ' + JSON.stringify(uiSchema, null, 2))
  }

  function updateOldTrafficConfig () {
    if (
      !_.isUndefined(plugin.properties.traffic.notificationRange) ||
      !_.isUndefined(plugin.properties.traffic.notificationTimeLimit)
    ) {
      plugin.properties.traffic.notificationZones.push({
        range: plugin.properties.traffic.notificationRange || 1852,
        timeLimit: plugin.properties.traffic.notificationTimeLimit || 600,
        level: 'alert',
        active: plugin.properties.traffic.sendNotifications
      })
      delete plugin.properties.traffic.notificationRange
      delete plugin.properties.traffic.notificationTimeLimit
      app.savePluginOptions(plugin.properties)
    }
  }

  return plugin
}

function load_calcs (app, plugin, dir) {
  fpath = path.join(__dirname, dir)
  files = fs.readdirSync(fpath)
  return files
    .map(fname => {
      pgn = path.basename(fname, '.js')
      return require(path.join(fpath, pgn))(app, plugin)
    })
    .filter(calc => {
      return typeof calc !== 'undefined'
    })
}
