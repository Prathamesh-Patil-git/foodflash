"""
FoodFlash API — Application Entry Point
Initializes the Flask web server, registers domain-specific API blueprints, 
configures Cross-Origin Resource Sharing (CORS), and serves static frontend assets.
"""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config

# Import blueprints
from routes.auth_routes import auth_bp
from routes.menu_routes import menu_bp
from routes.cart_routes import cart_bp
from routes.order_routes import order_bp
from routes.payment_routes import payment_bp
from routes.admin_routes import admin_bp
from routes.chatbot_routes import chatbot_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API blueprints
    app.register_blueprint(auth_bp,    url_prefix='/api/auth')
    app.register_blueprint(menu_bp,    url_prefix='/api')
    app.register_blueprint(cart_bp,    url_prefix='/api/cart')
    app.register_blueprint(order_bp,   url_prefix='/api/orders')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(admin_bp,   url_prefix='/api/admin')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

    # Serve frontend static files
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

    @app.route('/')
    def serve_index():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory(frontend_dir, filename)

    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'app': 'FoodFlash API', 'version': '1.0.0'}

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
