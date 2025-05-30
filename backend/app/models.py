from pydantic import BaseModel, Field, conint, constr, validator
from datetime import date
from typing import Optional, Literal


class Shipment(BaseModel):
    shipment_id: conint(ge=4000000) = Field(
        ..., description="Unique identifier for each shipment, starting from 4,000,000"
    )
    customer_id: conint(ge=10000, le=35000) = Field(
        ..., description="Customer identifier between 10000 and 35000"
    )
    origin: constr(min_length=2, max_length=2, regex=r"^[A-Z]{2}$") = Field(
        ..., description="Origin US state code (two uppercase letters)"
    )
    destination: Literal[
        "GUY", "SVG", "SLU", "BIM", "DOM", "GRD", "SKN", "ANU", "SXM", "FSXM"
    ] = Field(..., description="Destination country code")
    weight: conint(ge=0) = Field(..., description="Package weight in grams")
    volume: conint(ge=0) = Field(
        ..., description="Package volume in cubic centimeters (cm³)"
    )
    carrier: Literal["FEDEX", "DHL", "USPS", "UPS", "AMAZON"] = Field(
        ..., description="Shipping carrier"
    )
    mode: Literal["air", "sea"] = Field(..., description="Shipping mode: air or sea")
    status: Literal["received", "intransit", "delivered"] = Field(
        ..., description="Current shipment status"
    )
    arrival_date: date = Field(
        ..., description="Date package arrived at warehouse (YYYY-MM-DD)"
    )
    departure_date: Optional[date] = Field(
        None,
        description="Date package departed from warehouse (required if status is intransit or delivered)",
    )
    delivered_date: Optional[date] = Field(
        None, description="Date package was delivered (required if status is delivered)"
    )

    @validator("departure_date", always=True)
    def validate_departure_date(cls, v, values):
        status = values.get("status")
        if status in ["intransit", "delivered"] and v is None:
            raise ValueError(
                "departure_date is required when status is intransit or delivered"
            )
        return v

    @validator("delivered_date", always=True)
    def validate_delivered_date(cls, v, values):
        status = values.get("status")
        if status == "delivered" and v is None:
            raise ValueError("delivered_date is required when status is delivered")
        return v
