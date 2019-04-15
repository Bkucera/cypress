describe('rerender bug', () => {
  it('can find element after it rerenders', () => {
    cy.visit('/fixtures/generic.html')
    .then(() => {

      const div1 = cy.$$(/*html*/`
		<div><span>foobar</span></div>
		`)

      div1.appendTo(cy.$$('body'))
      cy.$$('body').append('<div style="height:1000px"></div>')
      cy.state('window').addEventListener('scroll', () => {
        div1[0].innerHTML = '<span>somefoo</span>'
      })

      cy.get('div span').should('be.visible').click({ timeout: 200 }).should('have.text', 'somefoo')

    })

  })
})
