import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from project root or backend directory
backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
root_dir = os.path.abspath(os.path.join(backend_dir, '..'))

load_dotenv(os.path.join(root_dir, '.env'))
load_dotenv(os.path.join(backend_dir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'maskoff-super-secret-production-key-2025-at-least-32-bytes')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'maskoff-jwt-super-secret-key-production-3030-auth-token-length')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Database Configuration: MySQL with automatic SQLite fallback
    # Example MySQL URI: mysql+pymysql://root:password@localhost:3306/maskoff_db
    DB_URL = os.environ.get('DATABASE_URL', '')
    if not DB_URL:
        # Default SQLite local database
        db_path = os.path.join(backend_dir, 'maskoff.db')
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    else:
        SQLALCHEMY_DATABASE_URI = DB_URL
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(backend_dir, 'uploads')
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max upload
    ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm', 'm4a', 'flac'}
    
    # AI Providers: 'gemini', 'openai', 'groq', or 'mock' (default fallback)
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'mock')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    AI_MODEL = os.environ.get('AI_MODEL', 'gemini-1.5-flash')
    
    # Speech to Text: 'whisper_api', 'local_whisper', or 'browser_fallback'
    STT_ENGINE = os.environ.get('STT_ENGINE', 'auto')
