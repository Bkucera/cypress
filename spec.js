/// <reference types="cypress"/>

it('works', () => {
  cy.visit('https://angular-oxkc7l-zirwfs.stackblitz.io/')
  cy.contains('To do', { timeout: 15000 }) // ensure page is loaded -__-

  const item = '.example-box:not(.cdk-drag-placeholder)'

  cy.get('#cdk-drop-list-1').children(item).should('have.length', 5)

  cy.get('.example-box:contains("Get to work")').dragTo('.example-box:contains("Get up")')
  cy.get('#cdk-drop-list-1').children(item).should('have.length', 6)

  // interpolates 10 extra mousemove events on the way
  cy.get('#cdk-drop-list-0').dragTo('#cdk-drop-list-1', { steps: 10 })
  cy.get('#cdk-drop-list-1').children(item).should('have.length', 7)

  // sets steps >= 10
  cy.get('#cdk-drop-list-0').dragTo('#cdk-drop-list-1', { smooth: true })
  cy.get('#cdk-drop-list-1').children(item).should('have.length', 8)

  cy.get('#cdk-drop-list-0').dragTo('#cdk-drop-list-1')
  cy.get('#cdk-drop-list-1').children(item).should('have.length', 9)
})

const getCoords = ($el) => {
  const domRect = $el[0].getBoundingClientRect()
  const coords = { x: domRect.left + (domRect.width / 2 || 0), y: domRect.top + (domRect.height / 2 || 0) }

  return coords
}

const dragTo = (subject, to, opts) => {

  opts = Cypress._.defaults(opts, {
    // delay inbetween steps
    delay: 0,
    // interpolation between coords
    steps: 0,
    // >=10 steps
    smooth: false,
  })

  if (opts.smooth) {
    opts.steps = Math.max(opts.steps, 10)
  }

  const win = subject[0].ownerDocument.defaultView

  const elFromCoords = (coords) => win.document.elementFromPoint(coords.x, coords.y)
  const winMouseEvent = win.MouseEvent

  const send = (type, coords, el) => {

    el = el || elFromCoords(coords)

    el.dispatchEvent(
      new winMouseEvent(type, Object.assign({}, { clientX: coords.x, clientY: coords.y }, { bubbles: true, cancelable: true }))
    )
  }

  const toSel = to

  function drag (from, to, steps = 1) {

    const fromEl = elFromCoords(from)

    const _log = Cypress.log({
      $el: fromEl,
      name: 'drag to',
      message: toSel,
    })

    _log.snapshot('before', { next: 'after', at: 0 })

    _log.set({ coords: to })

    send('mouseover', from, fromEl)
    send('mousedown', from, fromEl)

    cy.then(() => {
      return Cypress.Promise.try(() => {

        if (steps > 0) {

          const dx = (to.x - from.x) / steps
          const dy = (to.y - from.y) / steps

          return Cypress.Promise.map(Array(steps).fill(), (v, i) => {
            i = steps - 1 - i

            let _to = {
              x: from.x + dx * (i),
              y: from.y + dy * (i),
            }

            send('mousemove', _to, fromEl)

            return Cypress.Promise.delay(opts.delay)

          }, { concurrency: 1 })
        }
      })
      .then(() => {

        send('mousemove', to, fromEl)
        send('mouseover', to)
        send('mousemove', to)
        send('mouseup', to)
        _log.snapshot('after', { at: 1 }).end()

      })

    })

  }

  const $el = subject
  const fromCoords = getCoords($el)
  const toCoords = getCoords(cy.$$(to))

  drag(fromCoords, toCoords, opts.steps)
}

Cypress.Commands.addAll(
  { prevSubject: 'element' },
  {
    dragTo,
  }
)

/*

Unfortunately, you are running into two bugs, which are fixed in pending releases

1) a hidden input that has focus shouldn't be validated before being able to type, just like a user
2) __when the browser is out of focus__ chrome does not fire blur/focus events, which react-select relies on. Due to this bug, you won't see the dropdown appear when the chrome window is not focused.
  The next version of Cypress will polyfill these events, so even if the testing window does not have focus, your app will still behave as if it does.

  workarounds:
  for 1) you'll have to use `{force:true}` during the `.type`
  for 2) you can either make sure to have the window focused when running the test, or
*/
// it('react-select', ()=>{
//   cy.visit('https://react-select.com/creatable')
//   // cy.get('.css-10nd86i').eq(1).click() // click on the react-select div
//   // .find('input').focus() // workaround for bug #2
//   // cy.contains('Ocean').click({force:true}) // or the following:
//   // cy.focused().type('{downarrow}{enter}', {force:true})
//   // cy.focused().type('{enter}', {force:true})
//   // cy.focused().type('Ocean', {force:true})
//   cy.get('.css-10nd86i input').eq(1)
//     .focus() // workaround for bug #2
//     .type('Ocean', {force:true}) // workaround for bug #1

// })

// it('ace editor', ()=>{
//   cy.visit('https://ace.c9.io/')
//   cy.document().then(doc=>{
//     const input = cy.$$(`<textarea id="foo" type="range" min="0" max="10"/>`)
//     cy.$$('body').html(input)
//   })
//   cy.get('#foo').type('foo')
//   // cy.get('.ace_editor:first textarea').type('f{enter}', {force:true})
// })

// window.foo = 0
// window.foo2 = 0

// describe('page', function() {
//   // this.retries(10)

//   beforeEach(()=>{
//     cy.timeout(200)
//     cy.log(window.foo)
//     window.foo++
//     // expect(false).ok
//     if (window.foo > 1 && window.foo <= 2) {
//       cy.get('foo')
//     }
//   })

//   describe('inner tests', ()=>{
//     beforeEach(()=>{
//       window.foo2++
//       if (window.foo2 < 2){
//         cy.get('bar')
//       }
//     })
//     it('inner before each fail once', ()=>{
//       expect(true).ok
//     })
//   })

// it('pass', ()=>{
//   cy.get('bar').should('not.exist')
// })

// it('fail beforeEach twice', ()=>{
//   expect(true).ok
// })

// it('fail once', ()=>{
//   cy.log('foo2', window.foo2)
//   expect(++window.foo2).eq(2)
//   window.foo2 = 0
// })

// it('fail twice', ()=>{
//   cy.log('foo2', window.foo2)
//   expect(++window.foo2).eq(3)
//   window.foo2 = 0
// })

// it('fail four times', ()=>{
//   cy.log('foo2', window.foo2)
//   expect(++window.foo2).eq(5)
// })

// describe('describe 1', () => {
//   // beforeEach(() => {
//   //   cy.log('beforeEach')
//   //   cy.get('foo')
//   //   expect(window).to.have.prop('be1')
//   // })

//   describe('foooooo bars', () => {
//     beforeEach(() => {
//       window.foo++
//       expect(window.foo).to.be.gt(2)
//     })
//     it('can error 2 times', () => {
//       window.foo2++
//       expect(window.foo2).to.eq(3)
//     })
//     it('always fail', ()=>{
//       expect(false).ok
//     })
//   })
// })
// // new Array(2).fill().forEach((x,i) =>

// describe('always fail', ()=>{
//   it('will fail', ()=>{
//     expect(false).ok
//   })
//   // it('foo is 3', function() {
//   //   // ++window.foo
//   //   expect(window.foo).to.eq(2)
//   // })
// })
// // )
// // it('foobar', ()=>{
// //   console.log('foobar')
// // })
// })
