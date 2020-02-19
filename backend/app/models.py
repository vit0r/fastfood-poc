# -*- coding: utf-8 -*-
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import backref, relationship

try:
    from app.database import Base
except Exception:
    from database import Base

# Relationship TABLE [products_order]
products_order = Table(
    "products_order",
    Base.metadata,
    Column("order_id", Integer, ForeignKey("orders.id")),
    Column("product_id", Integer, ForeignKey("products.id")),
)


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    dt_closing = Column(DateTime)
    is_sentent = Column(Boolean, default=False)
    is_called = Column(Boolean, default=False)
    products = relationship(
        "Product", secondary=products_order, backref=backref("order", lazy="dynamic")
    )

    def __init__(self, order):
        if order is None:
            self.price = 0
            self.quantity = 0
        else:
            self.price = order.get("price", 0)
            self.quantity = order.get("quantity", 0)

    def __repr__(self):
        return "<Order %r>" % self.id


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(20), nullable=False)
    dt_created = Column(DateTime, default=datetime.now())

    def __init__(self, product):
        self.name = product.get("name")
        self.price = product.get("price")
        self.category = product.get("category", "DESCONHECIDA")

    def __repr__(self):
        return "<Product %r>" % self.id
