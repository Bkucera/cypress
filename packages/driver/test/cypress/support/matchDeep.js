const { _ } = Cypress
const { match } = Cypress.sinon
const jestDiff = require('jest-diff')
const prettyFormat = require('pretty-format')

const getDiffString = (exp, act) => {
  return jestDiff(exp, act, { callToJSON: true })
  .replace(/Array \[/g, '[')
  .replace(/Object \{/g, '{')
}

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
]
// const FORMAT_OPTIONS = {
//   plugins: PLUGINS,
// }
// const FORMAT_OPTIONS_0 = _.extend({}, FORMAT_OPTIONS, { indent: 0 })
const FORMAT_OPTIONS = {
  callToJSON: false,
  maxDepth: 10,
  plugins: PLUGINS,
  indent: 0,
}

console.log({ result: prettyFormat({ a: new Date(100) }) })

const getReplacementFor = (path, opts) => {
  let found

  _.each(opts, (val) => {
    const matched = (_.last(path) === _.last(val[0]))
       && _.isEqual(_.intersection(path, val[0]), val[0])

    if (matched) {
      found = val[1]
    }
  })

  return found
}

chai.Assertion.addMethod('matchDeep', function (opts, exp) {
  if (exp === undefined) {
    exp = opts
    opts = {}
  }

  const shouldCleanse = opts.shouldCleanse

  // console.log('shouldcleanse?', shouldCleanse)

  opts = _.omit(opts, 'shouldCleanse')

  opts = _.map(opts, (val, key) => {
    return [key.split('.'), val]
  })

  const act = this._obj

  const getType = (obj) => {
    return Object.prototype.toString.call(obj).split('[object ').join('').slice(0, -1)
  }

  const formatPath = (path = []) => {
    return `{ ${path.join(' > ')} }`
  }

  const genError = (_path, _exp, _act) => {
    return `${_path ? formatPath(_path) : ''}:\n\texpected ${_exp},\n\tbut was   ${_act}\n`
  }

  const matcherStringToObj = (mes) => {
    const res = mes.replace(/typeOf\("(\w+)"\)/, '$1')

    const ret = {}

    ret.toString = () => {
      return `${res}`
    }

    ret.toJSON = () => {
      return `match.${res}`
    }

    return ret
  }

  // const replaceVals = (obj, opts) => {
  // console.log('try replace:', obj)
  //   _.each(opts, (val, key) => {
  //     if (_.has(obj, key)) {
  //       let setFn = _.identity

  //       if (_.isFunction(val)) {
  //         setFn = val
  //       }

  // console.log('set val:', key, val)

  //       return _.set(obj, key, setFn(val))
  //     }
  //   })

  //   return obj
  // }

  const errs = []

  let noDiff = false

  const recurse = (_exp, _act, _path = []) => {

    return _.map(_.extend({}, _exp, _act), (_value, key) => {

      const newPath = _path.concat([key])

      if (_path.length > 8) {
        throw new Error('objects are 2 deep 4 me')
      }

      console.log(newPath)

      // if (errs.length > 20) {
      //   noDiff = true

      //   return
      // }

      let _actValue = _act && _act[key]
      let _expValue = _exp && _exp[key]

      const setValue = (obj, key, val) => {
        if (_.isObjectLike(obj)) {

          let setFn = () => {
            return val
          }

          if (_.isFunction(val)) {
            setFn = val
          }

          obj[key] = setFn(obj[key])
        }
      }

      const replacementVal = getReplacementFor(newPath, opts)

      // if (newPath.includes('attempts')) console.log(newPath)

      if (replacementVal) {
        // console.log(newPath, opts, replacementVal)

        if (shouldCleanse) {
          _expValue = replacementVal
          setValue(_exp, key, replacementVal)
        }

        _actValue = replacementVal
        setValue(_act, key, replacementVal)
      }

      if (_expValue && _expValue.toJSON && !match.isMatcher(_expValue)) {
        _expValue = _expValue.toJSON()
        setValue(_exp, key, _expValue)
      }

      if (_actValue && _actValue.toJSON && !match.isMatcher(_actValue)) {
        _actValue = _actValue.toJSON()
        setValue(_act, key, _actValue)
      }

      // const replacementKey = getReplacementFor(newPath, opts)

      // if (replacementKey !== undefined) {
      //   _actValue = replacementKey
      //   _act[key] = replacementKey

      if (match.isMatcher(_actValue)) {
        _act[key] = matcherStringToObj(_actValue.message)
      }
      // }

      if (match.isMatcher(_expValue)) {
        _exp[key] = matcherStringToObj(_expValue.message)
      }

      if (match.isMatcher(_actValue)) {
        if (match.isMatcher(_expValue)) {
          if (_actValue.toString() === _expValue.toString()) {
            return true
          }

          errs.push(new Error(`matchers are not equivalent, ${genError(newPath), _expValue.toString(), _actValue.toString()}`))

          return false
        }

        errs.push(new Error(`strange: expected value was not a matcher, ${genError(newPath, _actValue.toString(), _expValue)}`))

        return _actValue.toString()
      }

      if (match.isMatcher(_expValue)) {
        if (_expValue.test(_actValue)) {
          return _expValue.toString()
        }

        errs.push(new Error(`matcher failed: ${genError(newPath, _expValue.toString(), _actValue)}`))

        return
      }

      if (getType(_expValue) !== getType(_actValue)) {
        errs.push(new Error(`no match, ${genError(newPath, getType(_expValue), getType(_actValue))}`))
      }

      if (_.isObjectLike(_expValue) || _.isObjectLike(_actValue)) {
        return recurse(_expValue, _actValue, newPath)
      }

      if (_.isEqual(_expValue, _actValue)) {
        return true
      }

      errs.push(new Error(`not equal values for ${genError(newPath, _expValue, _actValue)}`))

      // throw new Error('this should never happen')

    })
  }

  if (getType(act) !== getType(exp)) {
    errs.push(new Error(`Objects are not of same type${genError(false, getType(exp), getType(act))}`))
  }

  recurse(exp, act, ['^'])

  if (errs.length) {

    const errStrings = errs.join('\n')

    let message = errStrings

    if (!noDiff) {
      message += `\n\n${getDiffString(exp, act)}`
    }

    window.lastActual = act

    this.assert(false, message)
    // throw errToThrow

  }

  this.assert(true, `expected **${chai.util.objDisplay(exp)}** to match **${chai.util.objDisplay(act)}**`)

})
const MATCHER_STR = '[MATCHES] '

const stringify = (obj_from_json, ind = 0) => {
  ind++

  if (typeof obj_from_json !== 'object') {
    // not an object, stringify using native function
    // const isObj = _.isString(obj_from_json) && obj_from_json.startsWith(MATCHER_STR)

    // if (_.isString(obj_from_json)) {
    //   // debugger
    // }

    // if (isObj) {
    //   obj_from_json = obj_from_json.slice(MATCHER_STR.length)

    // }

    let ret = JSON.stringify(obj_from_json)

    // if (isObj) {
    //   // debugger

    //   ret = `match.${ret.slice(1, -1)}`
    // }

    return ret // `${' '.repeat(ind)}${ret}`

  }

  if (_.isDate(obj_from_json)) {
    return `${JSON.stringify(obj_from_json)}`
  }

  if (obj_from_json.toJSON) {
    return obj_from_json.toJSON()
  }

  if (_.isRegExp(obj_from_json)) {
    return obj_from_json.toString()
  }

  if (_.isArray(obj_from_json)) {
    const props = _.map(obj_from_json,
      (value) => {
        return stringify(value, ind)
      })
    .map((item) => {
      return ' '.repeat(ind) + item
    })
    .join(',\n')

    return `[\n${props}\n${' '.repeat(ind)}]`
  }

  // Implements recursive object serialization according to JSON spec
  // but without quotes around the keys.
  let props = Object
  .keys(obj_from_json)
  .map((key) => {
    return `${key}:${stringify(obj_from_json[key], ind)}`
  })
  .map((item) => {
    return ' '.repeat(ind) + item
  })

  if (props.length) {
    return `{\n${props.join(',\n')}\n${' '.repeat(ind)}}`
  }

  return '{}'

}

module.exports = {
  stringify,

}
