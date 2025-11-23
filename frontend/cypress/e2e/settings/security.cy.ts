describe('Security Settings', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
    cy.contains('Settings').click();
  });

  it('should display security section', () => {
    cy.contains('Security').should('be.visible');
  });

  it('should display change password option', () => {
    cy.contains('Change Password').should('be.visible');
  });

  it('should display two-factor authentication section', () => {
    cy.contains('Two-Factor Authentication').should('be.visible');
  });

  it('should display delete account option', () => {
    cy.contains('Delete Account').should('be.visible');
  });
});
