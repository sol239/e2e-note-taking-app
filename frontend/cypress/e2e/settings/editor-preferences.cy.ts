describe('Editor Preferences Settings', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
    cy.contains('Settings').click();
    cy.get('.overflow-auto').scrollTo('bottom');
  });

  it('should display editor preferences section', () => {
    cy.contains('Editor Preferences').should('be.visible');
  });

  it('should display typography section', () => {
    cy.contains('Typography').should('be.visible');
  });

  it('should display font family selector', () => {
    cy.contains('Font Family').should('be.visible');
  });

  it('should display base font size input', () => {
    cy.contains('Base Font Size').should('be.visible');
  });

  it('should allow changing font family', () => {
    cy.contains('Font Family').parent().find('select').select('Georgia, serif');
    cy.contains('Font Family').parent().find('select').should('have.value', 'Georgia, serif');
  });

  it('should allow changing base font size', () => {
    cy.contains('Base Font Size').parent().find('input[type="number"]').clear().type('18');
    cy.contains('Base Font Size').parent().find('input[type="number"]').should('have.value', '18');
  });

  it('should display spacing & layout section', () => {
    cy.contains('Spacing & Layout').should('be.visible');
  });

  it('should display heading margins', () => {
    cy.contains('Heading Margins').should('be.visible');
  });

  it('should display block spacing controls', () => {
    cy.contains('Block Spacing').should('be.visible');
  });

  it('should display reset defaults button', () => {
    cy.contains('Reset Defaults').should('be.visible');
  });
});
