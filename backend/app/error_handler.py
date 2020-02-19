# -*- coding: utf-8 -*-
from flask_json import json_response
from werkzeug.debug import get_current_traceback

from status_code_enum import StatusCodeEnum


class ErrorHandler(object):
    @classmethod
    def register(cls, app):
        exception_codes = list(
            map(
                lambda c: c,
                range(
                    StatusCodeEnum.HTTP_500_INTERNAL_SERVER_ERROR,
                    StatusCodeEnum.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED,
                ),
            )
        )
        [
            app.register_error_handler(code, ErrorHandler.handler)
            for code in exception_codes
        ]

    @staticmethod
    def handler(error):
        traceback = get_current_traceback(
            skip=1, show_hidden_frames=True, ignore_system_exceptions=True
        )
        return json_response(
            status_=StatusCodeEnum.HTTP_500_INTERNAL_SERVER_ERROR,
            exception={
                "message": "{} {}".format(traceback.exception, error.message),
                "type": traceback.exception_type,
                "description": traceback.plaintext,
            },
        )
