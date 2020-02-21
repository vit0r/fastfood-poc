# -*- coding: utf-8 -*-

from flasgger import swag_from
from flask import Blueprint, json, request
from flask_json import json_response

from app.database import db_session
from app.models import Product
from app.schemas import ProductSchema
from app.status_code_enum import StatusCodeEnum
from app.utils import get_messages

products_blueprint = Blueprint(name="product", import_name=__name__, url_prefix="/api/")


@products_blueprint.route("product", methods=["POST"])
@swag_from("../swagger/product_post.yml")
def add():
    """
    {
        "name":"Egg Burger",
        "price":10.00,
        "category":"hamburguer"
    }
    :return: {"result": "product has been created","status_code": 201}
    """
    try:
        data = request.get_json(force=True)
        if not data or not data.get("name") or not data.get("price"):
            return json_response(
                status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
                result=get_messages("PRODUCT_REQUIRED_FIELDS"),
            )
        product = Product(data)
        db_session.add(product)
        db_session.commit()
        return json_response(
            status_=StatusCodeEnum.HTTP_201_CREATED,
            result=get_messages("PRODUCT_CREATED"),
        )
    except ValueError as ex:
        db_session.rollback()
        raise ex
    finally:
        db_session.close()


@products_blueprint.route("product/<product_id>", methods=["PUT"])
@swag_from("../swagger/product_put.yml")
def edit(product_id):
    """
    {
        "name":"Burger Cabulozo",
        "price":20,55,
        "category":"FastFood"
    }
    :param product_id: Product identify
    :return: {"result": "product has been changed","status_code": 202}
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return json_response(
                status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
                result=get_messages("PRODUCT_NOT_FOUND_COD").format(id),
            )
        data = request.get_json(force=True)
        if not data or not data.get("name") or not data.get("price"):
            return json_response(
                status_=StatusCodeEnum.HTTP_400_BAD_REQUEST,
                result=get_messages("PRODUCT_REQUIRED_FIELDS"),
            )
        product_schema = ProductSchema().dump(data).data
        if product_schema.get("name"):
            product.name = product_schema["name"]
        if product_schema.get("price"):
            product.price = data["price"]
        if product_schema.get("category"):
            product.category = data["category"]
        db_session.add(product)
        db_session.commit()
        return json_response(
            status_=StatusCodeEnum.HTTP_202_ACCEPTED,
            result=get_messages("PRODUCT_CHANGED"),
        )
    except ValueError as ex:
        db_session.rollback()
        raise ex
    finally:
        db_session.close()


@products_blueprint.route("product/<product_id>", methods=["DELETE"])
@swag_from("../swagger/product_delete.yml")
def delete(product_id):
    """
    http://192.168.25.20:9098/api/product/1
    :param product_id: Product identify
    :return: {"result": "product has been removed","status_code": 202}
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return json_response(
                status_=StatusCodeEnum.HTTP_404_NOT_FOUND,
                result=get_messages("PRODUCT_NOT_FOUND_COD").format(id),
            )
        db_session.delete(product)
        db_session.commit()
        return json_response(
            status_=StatusCodeEnum.HTTP_202_ACCEPTED,
            result=get_messages("PRODUCT_REMOVED"),
        )
    except ValueError as ex:
        db_session.rollback()
        raise ex
    finally:
        db_session.close()


@products_blueprint.route(
    "product/<product_id>",
    endpoint="products_by_id",
    defaults={"product_name": None},
    methods=["GET"],
)
@products_blueprint.route(
    "product/<product_name>/name",
    endpoint="products_by_name",
    defaults={"product_id": None},
    methods=["GET"],
)
@products_blueprint.route(
    "product/",
    endpoint="all_products",
    defaults={"product_id": None, "product_name": None},
    methods=["GET"],
)
@swag_from("../swagger/product_get_by_id.yml", endpoint="products_by_id")
@swag_from("../swagger/product_get_by_name.yml", endpoint="products_by_name")
@swag_from("../swagger/product_get.yml", endpoint="all_products")
def get(product_id, product_name):
    """
    http://host:9098/api/product/2 (with pro)
    http://host:9098/api/product/Vol/name (with name stats Vol)
    http://host:9098/api/product (All Products)
    :param product_id: Product identify
    :param product_name: Product Name
    :return:
        Single row with id = {"category": "hamburguer", "id": 2, "name": "Volts Burger", "price": 42.3}
        Many rows with name = [{"category": "hamburguer", "id": 2, "name": "Volts Burger", "price": 42.3}]
        All products = http://host:9098/api/product =
        [
            {"category": "DESCONHECIDA", "id": 1, "name": "Burger", "price": 12.3},
            {"category": "hamburguer", "id": 2, "name": "Volts Burger", "price": 42.3},
            {"category": "hamburguer", "id": 3, "name": "X Burger", "price": 15.0}
        ]
    """
    if product_id:
        result = ProductSchema().dump(Product.query.get(product_id))
    elif product_name:
        result = ProductSchema(many=True).dump(
            Product.query.filter(Product.name.like(f"{product_name}%"))
        )
    else:
        result = ProductSchema(many=True).dump(Product.query.all())
    if not result:
        return json_response(status_=StatusCodeEnum.HTTP_404_NOT_FOUND)
    return json.dumps(result)
