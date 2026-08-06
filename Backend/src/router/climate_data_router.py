from fastapi import APIRouter

from src.services.climate_data_service import get_climate_forecast

router = APIRouter()

@router.get("/api/climateforecast")
def get_forecast():

    forecast_text = get_climate_forecast()
    return {"forecast": forecast_text}