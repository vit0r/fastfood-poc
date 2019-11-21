# -*- coding: utf-8 -*-

from os.path import join, abspath, dirname

from flasgger import Swagger
from flask import Flask
from blueprints.order import orders_blueprint
from blueprints.product import products_blueprint
from error_handler import ErrorHandler

app = Flask('sound-order', instance_relative_config=True)
app.url_map.strict_slashes = False
ErrorHandler.register(app)
env_conf_file = join(abspath(dirname(__file__)), 'instance', 'env_main.cfg')
app.config.from_pyfile(env_conf_file)
app.register_blueprint(products_blueprint)
app.register_blueprint(orders_blueprint)

app.config['SWAGGER'] = {
    "swagger_version": "2.0",
    # headers are optional, and default to an empty array. If specified, they overwrites the headers with the same key in your flask app.
    "headers": [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Headers', "Authorization, Content-Type"),
        ('Access-Control-Expose-Headers', "Authorization"),
        ('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS"),
        ('Access-Control-Allow-Credentials', "true"),
        ('Access-Control-Max-Age', 60 * 60 * 24 * 20),
    ],
    # other optional settings
    # "url_prefix": "swaggerdocs",
    # "subdomain": "docs.mysite,com",
    # specs are also optional if not set /spec is registered exposing all views
    "specs": [
        {
            "version": "0.0.1",
            "title": "Api include day 5 v1",
            "endpoint": 'v1_spec',
            "route": '/v1/spec',

            # rule_filter is optional
            # it is a callable to filter the views to extract

            # "rule_filter": lambda rule: rule.endpoint.startswith(
            #    'should_be_v1_only'
            # )
        }
    ]
}

Swagger(app)

if __name__ == '__main__':
    app.run(host=app.config.get('HOST'), port=app.config.get('PORT'), debug=app.config.get('DEBUG'))
