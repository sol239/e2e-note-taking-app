describe('Notebook List', () => {
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

  it('should display greeting message', () => {
    cy.contains(/Good (morning|afternoon|evening)/).should('be.visible');
  });

  it('should display recently visited section', () => {
    cy.contains('Recently visited').should('be.visible');
  });

  it('should display action buttons', () => {
    cy.contains('New Notebook').should('be.visible');
    cy.contains('Import Notebook').should('be.visible');
  });

  it('should navigate to notebook when clicking on it', () => {
    // Wait for notebooks to load and find the first notebook link
    cy.get('a[href^="/notebooks/"]').first().click();
    
    // Should navigate to the notebook detail page
    cy.url({ timeout: 10000 }).should('match', /\/notebooks\/[a-f0-9-]+$/);
  });
});
