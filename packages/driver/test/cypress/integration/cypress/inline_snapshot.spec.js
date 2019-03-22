/* eslint-disable arrow-parens */

const { _ } = Cypress

const { mapStackTrace } = require('sourcemapped-stacktrace')

describe('inline snapshots', () => {
  it('can save', () => {
    // cy.log('foo').then(() => {
    //   const expect = act => {
    //     return {
    //       toMatchInlineSnapshot: exp => {
    //         if (!_.isEqual(exp, act)) {
    //           const err = new Error()

    //           err.type = 'inlineSnapshot'
    //           err.exp = exp
    //           err.act = act
    //           throw err
    //         }
    //       },
    //     }
    //   }

    //   const actual = {
    //     a: 'f',
    //     b: 'bar',
    //     c: 'baz',
    //   }

    //   expect(actual).toMatchInlineSnapshot(
    //     {
    //       a: 123,
    //     },
    //     `{
    //       "a": "f",
    //       "b": "bar",
    //       "c": "baz"
    //     }`
    //   )
    // })
    cy.visit('www.example.com')
    cy.wait(1000)

  })

  it('test 2', () => {
    cy.visit('/fixtures/dom.html')
    cy.wait(1000)
  })
  it('test 3', () => {})
  it('test 4', () => {})
  it('test 5', () => {})
  it('test 6', () => {})
  it('test 7', () => {})
})

Cypress.on('fail', err => {
  // debugger
  if (err.type === 'inlineSnapshot') {
    saveInlineSnapshot(err)
  }
})

const saveInlineSnapshot = err => {
  const filepath = Cypress.spec.absolute

  const trace = err.stack //.split('\n').slice(0, 3).slice(-1).join('\n')

  console.log('trace:', trace)

  new Cypress.Promise(res => {
    mapStackTrace(trace, res)
  })
  .then(stack => {
    return stack[1]
  })
  .tap(console.log)
  .then(stack => {
    cy.now('task', 'snapshot', [
      JSON.stringify(err.act, null, 2),
      filepath,
      {
        stack,
      },
    ]).then(ret => {
      // debugger
      console.log(ret)
    })
  })
}
