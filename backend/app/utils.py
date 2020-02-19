# -*- coding: utf-8 -*-
import codecs
import hashlib
import os
import re
from datetime import datetime
from os.path import abspath, dirname

import gtts
import numpy as np
import yaml
from babel import Locale, dates
from babel.numbers import format_currency
from flask import current_app
from pydub import AudioSegment
from pydub.playback import play

from app.database import db_session


def __get_md5(message):
    """Create MD5 hash"""
    try:
        m = hashlib.md5()
        msg_encoded = codecs.encode(message, current_app.config.get("TEXT_ENCODE"))
        m.update(msg_encoded)
        return m.hexdigest()
    except Exception as ex:
        print(ex)


def make_conversion(message):
    """Convert text to audio mp3 and returns message str"""
    try:
        if not message:
            return "{}".format(current_app.config.get("DEFAULT_MESSAGE"))
        tts = gtts.gTTS(text=message, lang=current_app.config.get("LANGUAGE"))
        md5_hash = __get_md5(message)
        audio_file = os.path.join(
            abspath(dirname(__file__)),
            current_app.config.get("AUDIO_STORAGE"),
            "{}{}".format(md5_hash, current_app.config.get("FILE_EXT")),
        )
        audio_storage_dir = os.path.dirname(audio_file)
        if not os.path.exists(audio_storage_dir):
            os.mkdir(audio_storage_dir)
        if not os.path.exists(audio_file):
            tts.save(audio_file)
        audio = AudioSegment.from_file(file=audio_file)
        play(audio)
    except ValueError as ex:
        print(ex)


def calc_order(products_order, order, products):
    try:
        order_items = list()
        for i, p in enumerate(products):
            quantity = products_order[i].get("quantity")
            order.price += p.price * quantity
            order.quantity += quantity
            p.order.append(order)
            order_items.append(p.name)
        order.dt_closing = datetime.now()
        db_session.add(order)
        db_session.commit()
        money_ext, money_ext_brl = money_format(order.price)
        order_itens_text = ", ".join(order_items).replace(".", " ponto ")
        message = get_messages("CLOSING_ORDER_MESSAGE").format(
            order.id, money_ext, order_itens_text, order.quantity
        )
        make_conversion(message)
    except ValueError as ex:
        print(ex)
        db_session.rollback()
    finally:
        db_session.close()


def sent_order(order):
    try:
        order.is_called = True
        order.is_sentent = True
        db_session.add(order)
        db_session.commit()
        message = get_messages("SENTENT_ORDER_MESSAGE").format(order.id)
        make_conversion(message)
    except ValueError as ex:
        print(ex)
        db_session.rollback()
    finally:
        db_session.close()


def call_order(order):
    try:
        order.is_called = True
        db_session.add(order)
        db_session.commit()
        message = get_messages("CALL_ORDER_MESSAGE").format(order.id)
        make_conversion(message)
    except ValueError as ex:
        print(ex)
        db_session.rollback()
    finally:
        db_session.close()


def money_format(price):
    try:
        decimal_point = np.modf(price)
        vf = int(np.around(decimal_point[0] * 100))
        cents = ""
        if vf > 0:
            cents = "e {} centavos".format(vf)
        dates.LC_TIME = Locale.parse(current_app.config.get("LOCALE_PARSER"))
        money_brl_ext = format_currency(
            price, current_app.config.get("COIN"), locale=dates.LC_TIME
        )
        money_ext = re.sub(r",..", cents, money_brl_ext.replace(".", ""))
        return money_ext, money_brl_ext
    except ValueError as e:
        print(e)


def get_messages(key):
    file_path = os.path.join(os.getcwd(), "messages.yaml")
    with codecs.open(
        file_path, mode="r", encoding=current_app.config.get("TEXT_ENCODE")
    ) as msg_file:
        msg_from_key = yaml.load(msg_file)
    return msg_from_key.get(key)
