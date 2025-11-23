describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it('should display the login page header', () => {
    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Sign in to your Notes account').should('be.visible');
  });

  it('should display the navigation', () => {
    cy.contains('Notes').should('be.visible');
  });

  it('should display the login form elements', () => {
    cy.contains('Email Address').should('be.visible');
    cy.contains('Password').should('be.visible');
  });
});