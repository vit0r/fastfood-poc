# -*- coding: utf-8 -*-

from os.path import abspath, dirname, join

from flask import Flask
from flask_cors import CORS

from app.blueprints.order import orders_blueprint
from app.blueprints.product import products_blueprint


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.url_map.strict_slashes = False
    env_conf_file = join(abspath(dirname(__file__)), "instance", "env_main.cfg")
    app.config.from_pyfile(env_conf_file)
    app.register_blueprint(products_blueprint)
    app.register_blueprint(orders_blueprint)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    return app
