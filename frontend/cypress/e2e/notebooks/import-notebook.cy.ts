describe('Import Notebook', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
    
    // Unlock notebooks by entering password
    cy.contains('Unlock Notebooks').click();
    cy.get('input[type="password"]').type('password');
    cy.contains('button', 'Unlock').click();
    
    // Wait for unlock to complete
    cy.wait(1000);
  });

  it('should display import button', () => {
    cy.contains('Import Notebook').should('be.visible');
  });

  it('should open file picker when clicking import', () => {
    // Check that the hidden file input exists
    cy.get('input[type="file"]').should('exist');
    cy.get('input[type="file"]').should('have.attr', 'accept', '.json,.zip');
  });
});
