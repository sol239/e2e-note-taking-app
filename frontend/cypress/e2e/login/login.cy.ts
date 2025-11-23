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

  it('should login successfully with valid credentials', () => {
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');

    cy.get('button[type="submit"]').click();

    // Wait for redirect and check URL
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
  });
});