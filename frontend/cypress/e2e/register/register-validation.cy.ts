describe('Register Validation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/register');
  });

  it('should require email field', () => {
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Should not navigate away
    cy.url().should('include', '/register');
  });

  it('should require password field', () => {
    cy.get('#email').type('test@example.com');
    cy.get('#confirmPassword').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Should not navigate away
    cy.url().should('include', '/register');
  });

  it('should require password confirmation', () => {
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Should not navigate away
    cy.url().should('include', '/register');
  });

  it('should validate password match', () => {
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('differentpassword');
    cy.get('button[type="submit"]').click();
    
    // Should display error or stay on register page
    cy.url().should('include', '/register');
  });

  it('should have link to login page', () => {
    cy.contains('Sign in here').should('be.visible');
    cy.contains('Sign in here').click();
    cy.url().should('include', '/login');
  });

  it('should validate email format', () => {
    cy.get('#email').type('invalidemail');
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('password123');
    
    // HTML5 validation should prevent submission
    cy.get('#email').should('have.attr', 'type', 'email');
  });
});
