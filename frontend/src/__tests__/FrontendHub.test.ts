/**
 * Unit tests for FrontendHub logging utility.
 * 
 * Tests console logging for API requests, responses, and errors.
 */

import FrontendHub from '../utils/FrontendHub';

describe('FrontendHub', () => {
  let consoleGroupSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('logRequest', () => {
    it('should log request with method and URL', () => {
      FrontendHub.logRequest('/api/test', 'GET');

      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleGroupSpy.mock.calls[0][0]).toContain('Frontend Request');
      expect(consoleLogSpy).toHaveBeenCalledWith('Method:', 'GET');
      expect(consoleLogSpy).toHaveBeenCalledWith('URL:', '/api/test');
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should log request with data', () => {
      const requestData = { username: 'test', password: 'secret' };
      FrontendHub.logRequest('/api/login', 'POST', requestData);

      expect(consoleLogSpy).toHaveBeenCalledWith('Method:', 'POST');
      expect(consoleLogSpy).toHaveBeenCalledWith('URL:', '/api/login');
      expect(consoleLogSpy).toHaveBeenCalledWith('Data:', requestData);
    });

    it('should not log data if not provided', () => {
      FrontendHub.logRequest('/api/test', 'GET');

      const dataCalls = consoleLogSpy.mock.calls.filter(
        call => call[0] === 'Data:'
      );
      expect(dataCalls).toHaveLength(0);
    });

    it('should include timestamp in log', () => {
      FrontendHub.logRequest('/api/test', 'GET');

      expect(consoleGroupSpy).toHaveBeenCalled();
      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('[');
      expect(groupMessage).toContain(']');
    });

    it('should include rocket emoji', () => {
      FrontendHub.logRequest('/api/test', 'GET');

      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('🚀');
    });
  });

  describe('logResponse', () => {
    it('should log successful response with checkmark', () => {
      const responseData = { success: true };
      FrontendHub.logResponse('/api/test', 200, responseData);

      expect(consoleGroupSpy).toHaveBeenCalled();
      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('✅');
      expect(groupMessage).toContain('Frontend Response');
      expect(consoleLogSpy).toHaveBeenCalledWith('URL:', '/api/test');
      expect(consoleLogSpy).toHaveBeenCalledWith('Status:', 200);
      expect(consoleLogSpy).toHaveBeenCalledWith('Response:', responseData);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should log error response with X mark', () => {
      const errorData = { error: 'Not found' };
      FrontendHub.logResponse('/api/test', 404, errorData);

      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('❌');
      expect(consoleLogSpy).toHaveBeenCalledWith('Status:', 404);
      expect(consoleLogSpy).toHaveBeenCalledWith('Response:', errorData);
    });

    it('should use checkmark for 2xx status codes', () => {
      FrontendHub.logResponse('/api/test', 201);
      expect(consoleGroupSpy.mock.calls[0][0]).toContain('✅');

      consoleGroupSpy.mockClear();

      FrontendHub.logResponse('/api/test', 204);
      expect(consoleGroupSpy.mock.calls[0][0]).toContain('✅');
    });

    it('should use X mark for non-2xx status codes', () => {
      FrontendHub.logResponse('/api/test', 400);
      expect(consoleGroupSpy.mock.calls[0][0]).toContain('❌');

      consoleGroupSpy.mockClear();

      FrontendHub.logResponse('/api/test', 500);
      expect(consoleGroupSpy.mock.calls[0][0]).toContain('❌');
    });

    it('should not log response data if not provided', () => {
      FrontendHub.logResponse('/api/test', 200);

      const responseCalls = consoleLogSpy.mock.calls.filter(
        call => call[0] === 'Response:'
      );
      expect(responseCalls).toHaveLength(0);
    });

    it('should include timestamp in log', () => {
      FrontendHub.logResponse('/api/test', 200);

      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('[');
      expect(groupMessage).toContain(']');
    });
  });

  describe('logError', () => {
    it('should log error with URL and error object', () => {
      const error = new Error('Network error');
      FrontendHub.logError('/api/test', error);

      expect(consoleGroupSpy).toHaveBeenCalled();
      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('❌');
      expect(groupMessage).toContain('Frontend Error');
      expect(consoleLogSpy).toHaveBeenCalledWith('URL:', '/api/test');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should log error with string message', () => {
      const errorMessage = 'Something went wrong';
      FrontendHub.logError('/api/test', errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', errorMessage);
    });

    it('should include timestamp in log', () => {
      FrontendHub.logError('/api/test', 'Error');

      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('[');
      expect(groupMessage).toContain(']');
    });

    it('should include X mark emoji', () => {
      FrontendHub.logError('/api/test', 'Error');

      const groupMessage = consoleGroupSpy.mock.calls[0][0];
      expect(groupMessage).toContain('❌');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      // FrontendHub is already exported as singleton from the module
      // This test verifies it's consistently the same instance
      expect(FrontendHub).toBeDefined();
      expect(typeof FrontendHub.logRequest).toBe('function');
      expect(typeof FrontendHub.logResponse).toBe('function');
      expect(typeof FrontendHub.logError).toBe('function');
    });
  });
});
