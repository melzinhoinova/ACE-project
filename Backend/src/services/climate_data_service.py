from dotenv import load_dotenv

import httpx
import requests
import os

load_dotenv()
open_meteo = os.getenv("OPEN_METEO_URL")
geo_encode = os.getenv("GEO_ENCODE_URL")

def get_geo_encode(city: str = "Tupã") -> dict:
    
    params = {
        "name": city,
        "count": 1,
        "language": "pt",
        "countryCode": "BR"
    }

    response = requests.get(geo_encode, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    results = data.get("results")
    if not results:
        return None

    location = results[0]
    
    return {
        "latitude": location["latitude"],
        "longitude": location["longitude"]
    }


def get_climate_data():

    geo_data: dict = get_geo_encode()

    latitude, longitude = geo_data["latitude"], geo_data["longitude"]

    params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": [
            "temperature_2m",
            "apparent_temperature",
        ],

        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
        ],
    }

    response = requests.get(open_meteo, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    return data


def get_climate_context() -> list:

    data: dict = get_climate_data()

    current = data["current"]

    context_prompt: list = []

    if current["temperature_2m"] >= 25:
        context_prompt.append(
            "Temperatura moderada à alta indica melhor venda de bebidas que são servidas geladas, considere o frescor de uma bebida trincando"
            ) 

    elif current["temperature_2m"] < 25:
        context_prompt.append(
            "Temperatura moderada à baixa indica melhor venda de bebidas que esquentam, conseidere o calor do alcool"
            )

    return context_prompt


def get_climate_forecast() -> dict:

    data: dict = get_climate_data()

    daily = data["daily"]
    min_temps = daily["temperature_2m_min"]
    max_temps = daily["temperature_2m_max"]

    # médias da temperatura de todos os dias
    mean_temps = [
        (min_temp + max_temp) / 2
        for min_temp, max_temp in zip(min_temps, max_temps)
    ]

    # quantos dias possuem altas temperaturas
    high_temperature_days = sum(
        temperature >= 25
        for temperature in mean_temps
    )

    total_days = len(mean_temps)

    # diagnóstico central
    if high_temperature_days >= total_days / 2:
        diagnostic = "alta_temperatura"
        recommendation = (
            "Focar em produtos gelados, como chopp e cerveja."
        )
    else:
        diagnostic = "baixa_temperatura"
        recommendation = (
            "Focar em produtos que despertem calor, como vinhos."
        )

    average_temp = round(sum(mean_temps) / total_days, 2)

    return {
        "diagnostic": diagnostic,
        "average_temperature": average_temp,
        "high_temperature_days": high_temperature_days,
        "total_days": total_days,
        "recommendation": recommendation,
    }