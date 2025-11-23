describe('Register Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/register');
  });

  it('should display the register page header', () => {
    cy.contains('Create Your Account').should('be.visible');
    cy.contains('Join Notes and start organizing your notes').should('be.visible');
  });

  it('should display the navigation', () => {
    cy.contains('Notes').should('be.visible');
  });

  it('should display the register form elements', () => {
    cy.contains('Email Address').should('be.visible');
    cy.contains('Password').should('be.visible');
    cy.contains('Confirm Password').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Create Account');
  });

  it('should display link to login page', () => {
    cy.contains('Already have an account?').should('be.visible');
    cy.contains('Sign in here').should('be.visible');
  });

  it('should redirect to notebooks page after successful registration', () => {
    // Generate a unique email to avoid conflicts
    const uniqueEmail = `e2e__test${Date.now()}@example.com`;

    cy.get('#email').type(uniqueEmail);
    cy.get('#password').type('testpassword123');
    cy.get('#confirmPassword').type('testpassword123');

    cy.get('button[type="submit"]').click();

    // Wait for redirect and check URL
    cy.url({ timeout: 10000 }).should('include', '/notebooks');

  });
});