describe('events', () => {
  let allStub

  before(() => {
    allStub = cy.stub()
    .callsFake(() => {
      debugger
    })
    Cypress.on('runnable:after:run:async', allStub)
  })

  beforeEach(() => {
    console.log('foobar')
  })
  it('test 1', () => {})
  it('test 2', () => {})

})
