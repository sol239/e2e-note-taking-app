describe('Login Validation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it('should show error with invalid credentials', () => {
    cy.get('#email').type('invalid@test.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Should display error message or stay on login page
    cy.url().should('include', '/login');
  });

  it('should require email field', () => {
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Should not navigate away
    cy.url().should('include', '/login');
  });

  it('should require password field', () => {
    cy.get('#email').type('test@example.com');
    cy.get('button[type="submit"]').click();
    
    // Should not navigate away
    cy.url().should('include', '/login');
  });

  it('should have link to register page', () => {
    cy.contains('Create one here').should('be.visible');
    cy.contains('Create one here').click();
    cy.url().should('include', '/register');
  });
});
