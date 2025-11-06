import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class BackendHub:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BackendHub, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the logging system"""
        # Create logs directory if it doesn't exist
        log_dir = Path(__file__).parent.parent / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        # Set up file handler
        log_file = log_dir / f'api_{datetime.now().strftime("%Y%m%d")}.log'
        
        # Configure logger
        self.logger = logging.getLogger('BackendHub')
        self.logger.setLevel(logging.INFO)
        
        # Remove existing handlers to avoid duplicates
        self.logger.handlers = []
        
        # File handler - logs to file
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        
        # Console handler - logs to console
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '🔵 [%(asctime)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def log_request(self, method: str, path: str, user: Optional[str] = None, data: Any = None):
        """Log incoming request"""
        log_data = {
            'type': 'REQUEST',
            'method': method,
            'path': path,
            'user': user,
        }
        
        if data:
            try:
                # Try to serialize data to JSON for logging
                if hasattr(data, 'dict'):
                    log_data['data'] = data.dict()
                elif isinstance(data, dict):
                    log_data['data'] = data
                else:
                    log_data['data'] = str(data)
            except Exception:
                log_data['data'] = str(data)
        
        message = f"REQUEST: {method} {path}"
        if user:
            message += f" | User: {user}"
        if data:
            message += f" | Data: {json.dumps(log_data.get('data', {}), default=str, indent=2)}"
        
        self.logger.info(message)
        print(f"\n{'='*80}")
        print(f"🚀 {method} {path}")
        if user:
            print(f"👤 User: {user}")
        if data:
            print(f"📦 Data: {json.dumps(log_data.get('data', {}), default=str, indent=2)}")
        print(f"{'='*80}\n")
    
    def log_response(self, method: str, path: str, status: int, data: Any = None):
        """Log outgoing response"""
        log_data = {
            'type': 'RESPONSE',
            'method': method,
            'path': path,
            'status': status,
        }
        
        if data:
            try:
                if hasattr(data, 'data'):
                    log_data['response'] = str(data.data)
                else:
                    log_data['response'] = str(data)
            except Exception:
                log_data['response'] = str(data)
        
        emoji = '✅' if 200 <= status < 300 else '❌'
        message = f"RESPONSE: {method} {path} | Status: {status}"
        
        self.logger.info(message)
        print(f"{emoji} Response: {status} | {method} {path}")
        if data and status >= 400:
            print(f"⚠️  Error: {log_data.get('response', '')}")
        print()
    
    def log_error(self, method: str, path: str, error: Exception):
        """Log error"""
        message = f"ERROR: {method} {path} | {str(error)}"
        self.logger.error(message)
        print(f"❌ ERROR: {method} {path}")
        print(f"⚠️  {str(error)}\n")


# Singleton instance
backend_hub = BackendHub()
