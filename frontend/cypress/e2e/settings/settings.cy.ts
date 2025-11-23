describe('Settings Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');

    cy.get('button[type="submit"]').click();

    // Wait for redirect and check URL
    cy.url({ timeout: 10000 }).should('include', '/notebooks');

    // Click on settings to open them
    cy.contains('Settings').click();
  });

  it('should load all content', () => {
    cy.contains('User Profile').should('be.visible');

    // Scroll to ensure all elements are in view
    cy.get('.overflow-auto').scrollTo('bottom');

    cy.contains('Settings').should('be.visible');
    cy.contains('Editor Preferences').should('be.visible');
    cy.contains('Typography').should('be.visible');
    cy.contains('Spacing & Layout').should('be.visible');
  });
});