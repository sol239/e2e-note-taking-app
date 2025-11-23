describe('Home Navigation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should navigate to login page', () => {
    cy.contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to register page from Get Started button', () => {
    cy.contains('Get Started').click();
    cy.url().should('include', '/register');
  });

  it('should display Notes logo', () => {
    cy.contains('Notes').should('be.visible');
  });
});
