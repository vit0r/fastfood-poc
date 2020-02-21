# -*- coding: utf-8 -*-

from flask import Blueprint, json, request
from flask_json import json_response

from app.database import db_session
from app.models import Order, Product
from app.schemas import OrderSchema, ProductsOrderSchema
from app.status_code_enum import StatusCodeEnum
from app.utils import calc_order, call_order, get_messages, money_format, sent_order

orders_blueprint = Blueprint(name="order", import_name=__name__, url_prefix="/api/")


@orders_blueprint.route("order/<order_id>", methods=["GET"])
@orders_blueprint.route("order", defaults={"order_id": None}, methods=["GET"])
def get(order_id):
    """
    http://host:9098/api/order/1
    http://host:9098/api/order
    :param order_id:
    :return:
    Single order with id = {"id": 1, "price": 211.5, "quantity": 9}
    Many orders without id = [
        {"id": 1, "price": 211.5, "quantity": 9},
        {"id": 2, "price": 0.0, "quantity": 0},
        {"id": 3, "price": 0.0, "quantity": 0}]
    """
    if order_id:
        result = OrderSchema().dump(Order.query.get(order_id))
    else:
        result = OrderSchema(many=True).dump(Order.query.order_by(Order.id).all())
    if not result:
        return json_response(status_=StatusCodeEnum.HTTP_404_NOT_FOUND)
    return json.dumps(result)


@orders_blueprint.route("order", methods=["POST"])
def close():
    """
    {
        "products":[{"id":1,"quantity":2},{"id":2,"quantity":3},{"id":3,"quantity":4}]
    }
    :return: {"result": "Order 1 closed.","status_code": 201}
    """
    json_data = request.get_json(force=True)
    if not json_data:
        return json_response(status_=StatusCodeEnum.HTTP_400_BAD_REQUEST)
    try:
        order = Order(None)
        db_session.add(order)
        db_session.commit()
        if not order:
            return json_response(
                status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
                result=get_messages("ORDER_NOT_FOUND"),
            )

        products_order = ProductsOrderSchema().dump(json_data)
        product_ids = list(map(lambda p: p.get("id"), products_order.get("products")))
        products = Product.query.filter(Product.id.in_(product_ids))
        if not products:
            return json_response(
                status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
                result=get_messages("PRODUCT_NOT_FOUND"),
            )
        if order.dt_closing:
            return json_response(
                status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
                result=get_messages("ORDER_HAS_CLOSED").format(order.id),
            )
        if order.is_sentent:
            return json_response(
                status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
                result=get_messages("ORDER_HAS_SENTENT").format(order.id),
            )
        calc_order(products_order.get("products"), order, products)
        *_, money_ext_brl = money_format(order.price)
        return json_response(
            status_=StatusCodeEnum.HTTP_201_CREATED,
            result=get_messages("CLOSING_ORDER_MESSAGE_POPUP").format(
                order.id, money_ext_brl, order.quantity
            ),
        )
    except ValueError as ex:
        db_session.rollback()
        raise ex
    finally:
        db_session.close()


@orders_blueprint.route("order/<order_id>/sent", methods=["PUT"])
def sent(order_id):
    """
    Sentent order after click on button
    """
    if not order_id:
        return json_response(
            status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
            result=get_messages("ORDER_NOT_FOUND"),
        )
    order = Order.query.filter(
        Order.id == order_id and not Order.is_sentent and Order.is_called
    ).one()
    if order:
        sent_order(order)
        return json_response(
            status_=StatusCodeEnum.HTTP_200_OK,
            result=get_messages("SENTENT_ORDER_MESSAGE").format(order.id),
        )
    return json_response(
        status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
        result=get_messages("ORDER_NOT_FOUND_COD").format(order_id),
    )


@orders_blueprint.route("order/<order_id>/call", methods=["PUT"])
def call(order_id):
    """
    Call order by Id
    """
    if not order_id:
        return json_response(
            status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
            result=get_messages("ORDER_COD_NOT_SPECIFIED"),
        )
    order = Order.query.filter(
        Order.id == order_id and not Order.is_sentent and not Order.is_called
    ).one()
    if order:
        call_order(order)
        return json_response(
            status_=StatusCodeEnum.HTTP_200_OK,
            result=get_messages("CALL_ORDER_MESSAGE").format(order.id),
        )
    return json_response(
        status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
        result=get_messages("ORDER_NOT_FOUND_COD").format(order_id),
    )


@orders_blueprint.route("order/called", methods=["GET"])
def called():
    """
    Get order has called
    """
    order = Order.query.filter(Order.is_called and Order.is_sentent == 0).first()
    if order:
        mapper = OrderSchema().dump(order)
        return json.dumps(mapper)
    return json_response(
        status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
        result=get_messages("ORDER_NOT_FOUND"),
    )
