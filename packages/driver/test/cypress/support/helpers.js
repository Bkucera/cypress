/* eslint arrow-body-style: "off" */

const { _, Promise } = Cypress

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

const createHooks = (win, hooks = []) => {
  _.each(hooks, (hook) => {

    if (_.isString(hook)) {
      hook = { type: hook }
    }

    let { type, fail, fn } = hook

    if (fn) {
      return win[type](new Function(fn.toString()))
    }

    if (fail) {

      const numFailures = fail

      return win[type](() => {
        if (_.isNumber(fail) && fail--) {
          debug(`hook pass after (${numFailures}) failures: ${type}`)

          return
        }

        debug(`hook fail: ${type}`)

        throw new Error(`hook failed: ${type}`)

      })
    }

    return win[type](() => {
      debug(`hook pass: ${type}`)
    })

  })
}

const createTests = (win, tests = []) => {
  _.each(tests, (test) => {
    if (_.isString(test)) {
      test = { name: test }
    }

    let { name, pending, fail, fn, only } = test

    let it = win.it

    if (only) {
      it = it['only']
    }

    if (fn) {
      // fn = parseFunction(fn)

      // if (test._fn) {
      //   fn = test._fn
      // }

      // console.log(fn.toString())

      return it(name, fn)
      // () => {
      //   return eval(`(${fn.toString()})()`)
      // })
    }

    if (pending) {
      return it(name)
    }

    if (fail) {
      return it(name, () => {
        if (_.isNumber(fail) && fail-- === 0) {
          debug(`test pass after retry: ${name}`)

          return
        }

        debug(`test failed: ${name}`)

        throw new Error(`test fail: ${name}`)
      })
    }

    return it(name, () => {
      debug(`test pass: ${name}`)
    })

  })
}

const createSuites = (win, suites = {}) => {
  _.each(suites, (obj, suiteName) => {
    win.describe(suiteName, () => {
      createHooks(win, obj.hooks)
      createTests(win, obj.tests)
      createSuites(win, obj.suites)
    })
  })
}

const generateMochaTestsForWin = (win, obj) => {
  createHooks(win, obj.hooks)
  createTests(win, obj.tests)
  createSuites(win, obj.suites)
}

const debug = require('debug')('spec')

window.localStorage.debug = 'spec*'

module.exports = {
  getQueueNames,

  getFirstSubjectByName,

  generateMochaTestsForWin,

  defer () {
    let resolve
    let reject
    let isPending = true
    let promise = new Promise(function (res, rej) {
      resolve = res
      reject = rej
    }).finally(() => {
      isPending = false
    })

    return {
      resolve,
      reject,
      promise,
      isPending: () => isPending,
    }
  },

}

const parseFunction = function (fn) {
  let funcReg = /function *\w*\(([^()]*)\)[ \n\t]*{(.*)}/gmi
  let match = funcReg.exec(fn.toString().replace(/(\/\/.*?)\n/g, '').replace(/\n/g, ' '))

  if (match) {
    return new Function(match[1].split(','), match[2])
  }

  return null
}
