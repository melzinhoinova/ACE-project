from dotenv import load_dotenv

import httpx
import requests
import os

load_dotenv()
open_meteo = os.getenv("OPEN_METEO_URL") or "https://api.open-meteo.com/v1/forecast"
geo_encode = os.getenv("GEO_ENCODE_URL") or "https://geocoding-api.open-meteo.com/v1/search"

DEFAULT_CITY = os.getenv("DEFAULT_CITY", "São Paulo")

def get_geo_encode(city: str | None = None) -> dict | None:
    target_city = city or DEFAULT_CITY
    params = {
        "name": target_city,
        "count": 1,
        "language": "pt",
        "countryCode": "BR"
    }

    try:
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
    except Exception:
        return None


def get_climate_data(city: str | None = None):
    geo_data = get_geo_encode(city)
    if not geo_data:
        # Coordenadas padrão de fallback (São Paulo: -23.5505, -46.6333)
        latitude, longitude = -23.5505, -46.6333
    else:
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


def get_climate_context(city: str | None = None) -> list:
    try:
        data: dict = get_climate_data(city)
        current = data.get("current", {})
        temp = current.get("temperature_2m", 24)

        context_prompt: list = []

        if temp >= 25:
            context_prompt.append(
                "Temperatura moderada à alta: favorece campanhas com apelo de frescor, energia, leveza e vivacidade."
            )
        else:
            context_prompt.append(
                "Temperatura moderada à baixa: favorece campanhas com apelo acolhedor, conforto, sofisticação e intensidade."
            )

        return context_prompt
    except Exception:
        return ["Clima estável propício para engajamento e conexão da marca com o público."]


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