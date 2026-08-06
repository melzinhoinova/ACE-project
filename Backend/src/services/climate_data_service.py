from dotenv import load_dotenv

import requests
import os

load_dotenv()
open_meteo = os.getenv("OPEN_METEO_URL")

def get_climate_data():
    latitude, longitude = 21.5601, 50.3045

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


def get_climate_forecast() -> list:

    data: dict = get_climate_data()

    # 0 = temp. baixa / 1 = temp. alta
    temperature_diagnostic: list = []

    daily = data["daily"]
    min_temps = daily["temperature_2m_min"]
    max_temps = daily["temperature_2m_max"]

    for min_temp, max_temp in zip(min_temps, max_temps):
        day_mean = (min_temp + max_temp) / 2
        if day_mean >= 25:
            temperature_diagnostic.append(1)
        else:
            temperature_diagnostic.append(0)

    if sum(temperature_diagnostic) >= (len(temperature_diagnostic) / 2):
        return """
        Uma onda de altas temperaturas prevista para a próxima semana.
        Focar em produtos gelados, como chopp e cerveja. 
        """ 

    return """
    Uma onda de baixas temperaturas prevista para a próxima semana.
    Focar em produtos que despertem calor, como vinhos.
    """