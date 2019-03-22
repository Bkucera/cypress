const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')

const browserify = require('@cypress/browserify-preprocessor')
const { saveCypressInlineSnapshot } = require('./snapshot')

const state = {}

module.exports = (on) => {
  const options = browserify.defaultOptions

  // enable sourcemaps
  options.browserifyOptions.debug = true

  options.browserifyOptions.transform[1][1].babelrc = true

  on('file:preprocessor', browserify(options))
  on('task', {
    'return:arg' (arg) {
      return arg
    },
    'wait' () {
      return Promise.delay(2000)
    },
    'create:long:file' () {
      const filePath = path.join(__dirname, '..', '_test-output', 'longtext.txt')
      const longText = _.times(2000).map(() => {
        return _.times(20).map(() => {
          return Math.random()
        }).join(' ')
      }).join('\n\n')

      fs.outputFileSync(filePath, longText)

      return null
    },
    snapshot (args) {

      saveCypressInlineSnapshot(...args)

      return null
    },

    state ([key, value]) {
      console.log(key, value)
      if (value === undefined) {
        return state[key]
      }

      state[key] = value

      return null
    },
  })
}
