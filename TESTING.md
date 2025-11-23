# Testing Documentation

This document provides comprehensive information about the unit tests for the E2E Note-Taking App.

## Overview

The project includes extensive unit tests for both backend (Django) and frontend (Next.js/TypeScript) components.

## Backend Tests (Django)

### Test Structure

Backend tests are organized by Django app:

```
backend/
├── accounts/
│   ├── test_models.py       # User model tests
│   ├── test_serializers.py  # Serializer tests
│   └── test_views.py        # API endpoint tests
└── notes/
    ├── test_models.py       # Notebook/Block model tests
    ├── test_serializers.py  # Serializer tests
    └── test_views.py        # API endpoint tests
```

### Running Backend Tests

```bash
cd backend

# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test accounts
python manage.py test notes

# Run specific test file
python manage.py test accounts.test_models

# Run specific test class
python manage.py test accounts.test_models.UserManagerTests

# Run specific test method
python manage.py test accounts.test_models.UserManagerTests.test_create_user

# Run with verbose output
python manage.py test --verbosity=2

# Run with code coverage (requires coverage package)
coverage run --source='.' manage.py test
coverage report
coverage html  # Generates HTML report in htmlcov/
```

### Backend Test Coverage

#### Accounts App Tests

**test_models.py** - User Model Tests
- User creation and validation
- Email normalization
- Superuser creation
- Password hashing
- Two-factor authentication fields
- End-to-end encryption fields
- Field defaults and constraints

**test_serializers.py** - Serializer Tests
- UserSerializer field validation
- UpdateUserSerializer validation
- Read-only field enforcement
- Email validation
- Nickname length constraints

**test_views.py** - API Endpoint Tests
- User registration (with/without E2E fields)
- Login (with/without 2FA)
- User detail retrieval and updates
- Two-factor authentication setup/enable/disable/verify
- Recovery key verification
- Password change
- Account deletion
- Encrypted master key retrieval
- Authentication and permission checks

#### Notes App Tests

**test_models.py** - Model Tests
- Notebook creation and UUID generation
- Block creation with various types
- NotebookUserConnector relationships
- BlockNotebookConnector with positioning
- Cascade deletion behavior
- Multi-user notebook access

**test_serializers.py** - Serializer Tests
- NotebookSerializer validation
- BlockSerializer with metadata/settings
- Nested serializer relationships
- Position field serialization

**test_views.py** - API Endpoint Tests
- Notebook list/create/retrieve/update/delete
- Block list/create/retrieve/update/delete
- Position tracking
- Last opened timestamp updates
- Import/export (JSON and ZIP formats)
- Access control and permissions
- Error handling for invalid data

### Backend Test Statistics

- **Total Test Files**: 6
- **Accounts App Tests**: ~60 test methods
- **Notes App Tests**: ~50 test methods
- **Total Coverage**: Models, Serializers, and Views

## Frontend Tests (Jest + React Testing Library)

### Test Structure

Frontend tests are located in `frontend/src/__tests__/`:

```
frontend/src/__tests__/
├── Block.test.ts            # Block model tests
├── DocumentManager.test.ts  # DocumentManager tests
├── CryptoManager.test.ts    # Encryption utility tests
└── FrontendHub.test.ts      # Logging utility tests
```

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Block.test.ts

# Update snapshots
npm test -- -u
```

### Frontend Test Coverage

#### Block.test.ts
- Block constructor with various parameters
- All block types (paragraph, heading, code, image, etc.)
- Clone method (shallow copy)
- isEmpty method (whitespace handling)
- Metadata variations (code language, todo checked, image dimensions, grid cells)
- Settings variations (styling options)

#### DocumentManager.test.ts
- Constructor with/without initial blocks
- getBlocks (returns copy of array)
- addBlock (at end, at index, at position 0)
- updateBlock (content, type, metadata)
- deleteBlock (with minimum block enforcement)
- moveBlock (forward, backward, boundary checks)
- generateId (UUID format validation)
- onChange callbacks for all operations

#### CryptoManager.test.ts
- Singleton pattern
- Master key status checking (hasMasterKey, clearMasterKey)
- Master key generation and encryption
- Master key decryption from bundle
- Error handling for missing master key
- Encryption/decryption operations (with master key checks)
- Re-encryption for password changes

#### FrontendHub.test.ts
- Request logging with method/URL/data
- Response logging with success/error indicators
- Error logging
- Timestamp inclusion
- Emoji indicators (🚀 for requests, ✅/❌ for responses/errors)
- Singleton pattern

### Jest Configuration

The frontend uses Jest with the following configuration:

**jest.config.js**
- Preset: ts-jest
- Test environment: jsdom (for React/DOM testing)
- Module name mapper for path aliases
- Coverage collection from TypeScript files
- Test file patterns in `__tests__` directories

**jest.setup.js**
- Configures @testing-library/jest-dom matchers
- Mocks window.crypto for encryption tests
- Mocks btoa/atob for base64 operations

## Test Best Practices

### Backend (Django)

1. **Use setUp and tearDown**: Initialize test data in setUp method
2. **Test isolation**: Each test should be independent
3. **Use appropriate assertions**: self.assertEqual, self.assertTrue, etc.
4. **Test edge cases**: Empty data, invalid inputs, permissions
5. **Mock external services**: Use Django's test client and mocks
6. **Database transactions**: Tests run in transactions and roll back automatically

### Frontend (Jest)

1. **Mock dependencies**: Mock crypto APIs, external libraries
2. **Test behavior, not implementation**: Focus on inputs/outputs
3. **Use descriptive test names**: Should clearly state what is being tested
4. **Group related tests**: Use describe blocks for organization
5. **Clear mocks between tests**: Use beforeEach/afterEach
6. **Test error cases**: Verify error handling and edge cases

## Continuous Integration

### Adding Tests to CI/CD

**Backend (Django)**
```yaml
- name: Run Backend Tests
  run: |
    cd backend
    python manage.py test --verbosity=2
```

**Frontend (Jest)**
```yaml
- name: Run Frontend Tests
  run: |
    cd frontend
    npm test -- --coverage --watchAll=false
```

## Coverage Goals

- **Backend**: Aim for >80% code coverage on models, serializers, and views
- **Frontend**: Aim for >70% code coverage on utility classes and models

## Adding New Tests

### Backend Test Template

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class MyFeatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Set up test data
    
    def test_feature_works(self):
        # Arrange
        # Act
        # Assert
        pass
```

### Frontend Test Template

```typescript
describe('MyComponent', () => {
  describe('feature', () => {
    it('should do something', () => {
      // Arrange
      
      // Act
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

## Troubleshooting

### Backend Issues

**Import errors**: Make sure you're in the backend directory and Django is installed
```bash
cd backend
pip install -r requirements.txt
```

**Database errors**: Migrations may not be applied in test database
```bash
python manage.py test --keepdb  # Reuse test database
```

### Frontend Issues

**Module not found**: Install dependencies
```bash
npm install
```

**TypeScript errors**: Check tsconfig.json includes test types
```json
"types": ["jest", "@testing-library/jest-dom"]
```

**Crypto mocking issues**: Ensure jest.setup.js properly mocks window.crypto

## Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Django REST Framework Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)
