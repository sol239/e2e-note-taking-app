class FrontendHub {
  private static instance: FrontendHub;

  private constructor() {}

  static getInstance(): FrontendHub {
    if (!FrontendHub.instance) {
      FrontendHub.instance = new FrontendHub();
    }
    return FrontendHub.instance;
  }

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

  logError(url: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    console.group(`❌ [${timestamp}] Frontend Error`);
    console.log('URL:', url);
    console.error('Error:', error);
    console.groupEnd();
  }
}

export default FrontendHub.getInstance();
