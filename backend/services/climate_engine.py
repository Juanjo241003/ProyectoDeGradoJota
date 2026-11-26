"""
Motor Matemático de Climatología y Sensación Térmica
Implementa la ecuación oficial de Rothfusz (NOAA / National Weather Service)
para el cálculo del Índice de Calor (Heat Index - HI)
"""
import math

def calcular_indice_calor_rothfusz(temp_celsius: float, humedad_relativa: float) -> dict:
    """
    Calcula el Índice de Calor (Sensación Térmica) usando la regresión polinomial
    de Rothfusz (NOAA / NWS).
    
    Parámetros:
    - temp_celsius: Temperatura del aire en °C (rango típico 20°C a 45°C)
    - humedad_relativa: Humedad relativa en porcentaje (0% a 100%)
    
    Retorna:
    - dict con HI en °C, nivel de riesgo y efecto fisiológico.
    """
    # La regresión de Rothfusz opera en grados Fahrenheit
    T_F = (temp_celsius * 9.0 / 5.0) + 32.0
    RH = humedad_relativa

    # Si la temperatura ambiente es inferior a 26.7°C (80°F), el efecto del calor es bajo
    if T_F < 80.0:
        HI_F = 0.5 * (T_F + 61.0 + ((T_F - 68.0) * 1.2) + (RH * 0.094))
    else:
        # Polinomio de 9 coeficientes de Rothfusz
        HI_F = (-42.379 +
                (2.04901523 * T_F) +
                (10.14333127 * RH) -
                (0.22475541 * T_F * RH) -
                (0.00683783 * T_F * T_F) -
                (0.05481717 * RH * RH) +
                (0.00122874 * T_F * T_F * RH) +
                (0.00085282 * T_F * RH * RH) -
                (0.00000199 * T_F * T_F * RH * RH))

        # Ajuste por baja humedad
        if RH < 13.0 and 80.0 <= T_F <= 112.0:
            ajuste = ((13.0 - RH) / 4.0) * math.sqrt((17.0 - abs(T_F - 95.0)) / 17.0)
            HI_F -= ajuste

        # Ajuste por alta humedad
        if RH > 85.0 and 80.0 <= T_F <= 87.0:
            ajuste = ((RH - 85.0) / 10.0) * ((87.0 - T_F) / 5.0)
            HI_F += ajuste

    HI_C = (HI_F - 32.0) * 5.0 / 9.0
    # No puede ser menor que la temperatura ambiente
    sensacion_termica = max(temp_celsius, round(HI_C, 2))

    # Clasificación de riesgo térmico según NOAA / OMS
    if sensacion_termica < 27.0:
        nivel_riesgo = "Confort / Normal"
        efecto = "Condición cómoda; uso mínimo de climatización activa."
    elif 27.0 <= sensacion_termica < 32.0:
        nivel_riesgo = "Precaución"
        efecto = "Fatiga posible con exposición prolongada. Uso de ventilación o A/C a baja carga."
    elif 32.0 <= sensacion_termica < 41.0:
        nivel_riesgo = "Precaución Extrema"
        efecto = "Golpe de calor posible. Uso continuado de aire acondicionado y sobrecarga en compresores."
    elif 41.0 <= sensacion_termica < 54.0:
        nivel_riesgo = "Peligro"
        efecto = "Golpe de calor probable. Ciclo de trabajo de climatización superior al 85%."
    else:
        nivel_riesgo = "Peligro Extremo"
        efecto = "Golpe de calor inminente. Exigencia térmica máxima sobre los compresores de climatización y refrigeración."

    return {
        "temperatura_aire_c": temp_celsius,
        "humedad_relativa_porc": humedad_relativa,
        "sensacion_termica_c": sensacion_termica,
        "nivel_riesgo": nivel_riesgo,
        "efecto_fisiologico": efecto
    }
