from marshmallow import Schema, fields, post_load

from app.models import Order, Product


class ProductSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    price = fields.Float()
    category = fields.String()
    quantity = fields.Integer()

    @post_load
    def make_product(self, data):
        return Product(**data)


class OrderSchema(Schema):
    id = fields.Integer()
    price = fields.Float()
    quantity = fields.Integer()
    dt_closing = fields.DateTime()
    is_called = fields.Boolean()
    is_sentent = fields.Boolean()

    @post_load
    def make_order(self, data):
        return Order(**data)


class ProductsOrderSchema(Schema):
    id = fields.Integer()
    order_id = fields.Integer()
    price = fields.Float()
    quantity = fields.Integer()
    products = fields.List(fields.Nested(ProductSchema))
