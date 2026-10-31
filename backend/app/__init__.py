import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .models import db
from .utils.seed_data import seed_database

jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)
    jwt.init_app(app)

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.scenarios import scenarios_bp
    from .routes.sessions import sessions_bp
    from .routes.audio import audio_bp
    from .routes.analysis import analysis_bp
    from .routes.dashboard import dashboard_bp
    from .routes.weakness import weakness_bp
    from .routes.recommendations import recommendations_bp
    from .routes.missions import missions_bp
    from .routes.mindspace import mindspace_bp
    from .routes.profile import profile_bp
    from .routes.chatbot import chatbot_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(scenarios_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(audio_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(weakness_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(missions_bp)
    app.register_blueprint(mindspace_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(chatbot_bp)

    # Serve uploaded audio files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'online',
            'platform': 'MaskOff AI Backend',
            'version': '1.0.0',
            'ai_provider': app.config.get('AI_PROVIDER', 'mock')
        }), 200

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing authorization token'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({'error': 'Invalid or expired authorization token'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired, please log in again'}), 401

    # Database initialization and seeding
    with app.app_context():
        try:
            db.create_all()
            seed_database()
        except Exception as e:
            app.logger.error(f"Database init error: {e}")

    return app

