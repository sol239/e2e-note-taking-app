describe('User Profile Settings', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
    cy.contains('Settings').click();
  });

  it('should display user profile section', () => {
    cy.contains('User Profile').should('be.visible');
  });

  it('should display email field', () => {
    cy.contains('Email Address').should('be.visible');
  });

  it('should display nickname field', () => {
    cy.contains('Nickname').should('be.visible');
  });

  it('should allow editing nickname', () => {
    // Find the edit button for nickname
    cy.contains('Nickname').parent().parent().find('button').first().click();
    
    // Input should be visible
    cy.get('input[value*=""]').should('be.visible');
  });
});
