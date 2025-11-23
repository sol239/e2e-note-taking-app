/**
 * FrontendHub - Centralized logging system for frontend API requests.
 * 
 * Provides console logging with timestamps and emoji indicators for better
 * visibility during development. Implements singleton pattern to ensure
 * consistent logging across the application.
 */
class FrontendHub {
  private static instance: FrontendHub;

  private constructor() {}

  /**
   * Get the singleton instance of FrontendHub.
   * @returns The FrontendHub singleton instance
   */
  static getInstance(): FrontendHub {
    if (!FrontendHub.instance) {
      FrontendHub.instance = new FrontendHub();
    }
    return FrontendHub.instance;
  }

  /**
   * Log an outgoing API request.
   * @param url - The API endpoint URL
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param data - Optional request payload data
   */
  logRequest(url: string, method: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.group(`🚀 [${timestamp}] Frontend Request`);
    console.log('Method:', method);
    console.log('URL:', url);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }

  /**
   * Log an API response.
   * @param url - The API endpoint URL
   * @param status - HTTP status code
   * @param data - Optional response data
   */
  logResponse(url: string, status: number, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.group(`${emoji} [${timestamp}] Frontend Response`);
    console.log('URL:', url);
    console.log('Status:', status);
    if (data) {
      console.log('Response:', data);
    }
    console.groupEnd();
  }

  /**
   * Log an API error.
   * @param url - The API endpoint URL where the error occurred
   * @param error - The error object or message
   */
  logError(url: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    console.group(`❌ [${timestamp}] Frontend Error`);
    console.log('URL:', url);
    console.error('Error:', error);
    console.groupEnd();
  }
}

export default FrontendHub.getInstance();
