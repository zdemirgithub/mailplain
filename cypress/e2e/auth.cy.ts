describe('Authentication flow', () => {
  it('renders sign-in page', () => {
    cy.visit('/sign-in');
    cy.contains('Sign In').should('be.visible');
  });

  it('signs in successfully', () => {
    cy.visit('/sign-in');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/sign-in');
    cy.contains('Welcome').should('be.visible');
  });

  it('signs out successfully', () => {
    // Assuming user is signed in here
    cy.visit('/');
    cy.get('button[aria-label="Sign out"]').click();
    cy.url().should('include', '/sign-in');
  });
});
