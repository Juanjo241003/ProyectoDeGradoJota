# PLAN MAESTRO DE INGENIERÍA Y METODOLOGÍA: SISTEMA WEB DE SIMULACIÓN DE CONSUMO ELÉCTRICO EN TRINIDAD

**Proyecto de Grado:** Sistema Web para la Simulación del Consumo Eléctrico Domiciliario y su Impacto Económico Bajo Escenarios de Variabilidad Climática en Trinidad  
**Postulante:** Univ. Juan José García Cáceres  
**Carrera:** Ingeniería de Sistemas – UABJB  
**Normativa Base:** Reglamento CIS 2013 | Resolución AETN N° 666/2023  

---

## 1. VISIÓN GENERAL Y OBJETIVO DEL SISTEMA
El sistema es una plataforma web interactiva y determinística que permite a los hogares del área urbana de Trinidad, Beni:
1. **Configurar su inventario técnico domiciliario** (aires acondicionados de 9k, 12k, 18k, 24k BTU convencionales o Inverter, refrigeración, ventilación y carga pasiva).
2. **Someter su hogar a escenarios climáticos reales y proyectados** (meses fríos/surazos, meses típicos de transición y olas de calor extremo de 38°C a 41.3°C).
3. **Simular el consumo energético (kWh) y el impacto económico (Bs.)**, desglosando la factura bajo el pliego escalonado vigente de **ENDE DELBENI S.A.M. (AETN N° 666/2023)** y advirtiendo de forma preventiva el *salto de bloque tarifario* o pérdida de *Tarifa Dignidad*.
4. **Validar la precisión del modelo matemático frente a 150 facturas reales** de 15 hogares de Trinidad, calculando automáticamente el indicador de error **MAPE < 10%** exigido por la Hipótesis de grado.

---

## 2. STACK TECNOLÓGICO SELECCIONADO (DEFENDIBLE ANTE TRIBUNAL)

Para maximizar la robustez técnica y garantizar una defensa académica impecable, se adopta una arquitectura modular desacoplada:

- **Motor y Backend (Python / FastAPI):**
  - *¿Por qué?* Python es el estándar científico para modelos matemáticos, cálculo estadístico y regresiones. FastAPI ofrece tipado estricto (Pydantic), alto rendimiento asíncrono y documentación interactiva automática OpenAPI/Swagger (imprescindible para el manual técnico de la tesis).
- **Base de Datos (Relacional - SQLite para portabilidad / PostgreSQL ready):**
  - *¿Por qué?* Estructura relacional con llaves primarias, foráneas e integridad referencial estricta. Portátil para la defensa pública en una laptop sin depender de conexiones remotas.
- **Frontend (React + Vite + TailwindCSS):**
  - *¿Por qué?* Interfaz reactiva en tiempo real. Permite al tribunal mover deslizadores de temperatura/horas de A/C y ver cómo la aguja de la factura salta de bloque tarifario instantáneamente.

---

## 3. PLAN DETALLADO DE IMPLEMENTACIÓN EN 5 FASES

### FASE 1: Base de Datos Relacional y Carga de Semillas Empíricas
- **¿Qué haremos?**
  - Crear el esquema de base de datos relacional normalizado en 3FN:
    - `tarifas_bloques`: Estructura AETN 666/2023 (bloques, costo por kWh, cargo fijo, alumbrado, aseo, Tarifa Dignidad).
    - `escenarios_climaticos`: Serie temporal histórica de Trinidad (2025–2026: T_max, T_med, T_min, Humedad, Bochorno).
    - `equipos_catalogo`: Catálogo predeterminado de electrodomésticos con potencias nominales en kW y factores de modulación térmica.
    - `hogares_muestra`: Registro anonimizado de los 15 hogares de la muestra.
    - `facturas_reales`: Los 150 registros empíricos (mes, kWh, Bs. energía, tasas, total).
- **¿Para qué sirve?**
  - Elimina toda alucinación. El sistema trabajará sobre la realidad empírica y normativa del Beni.

### FASE 2: Motor Matemático de Simulación y Algoritmos de Cálculo
- **¿Qué haremos?**
  - **Módulo Climático y Sensación Térmica:**
    - Implementación canónica de la ecuación de Rothfusz (NOAA/NWS) para calcular el Índice de Calor ($HI$).
    - Determinación del delta térmico exterior vs. temperatura de consigna de confort ($24^\circ\text{C}$).
  - **Módulo de Respuesta Térmica de Climatización:**
    - Modelo de ciclo de trabajo del compresor: cómo cada grado adicional de sensación térmica incrementa el porcentaje de funcionamiento del compresor en equipos On/Off y la modulación de frecuencia en Inverter.
    - Cálculo del consumo mensual desagregado: $\text{kWh}_\text{base} + \text{kWh}_\text{refrigeración} + \text{kWh}_\text{climatización}(HI)$.
  - **Módulo de Facturación Normativa:**
    - Algoritmo escalonado por tramos:
      $$\text{Total} = \text{Cargo Fijo} + \sum (\text{kWh}_i \times \text{Tarifa}_i) - \text{Tarifa Dignidad (si aplica)} + \text{Alumbrado} + \text{Aseo}$$
    - Detector preventivo de salto de bloque y coste marginal del $\text{kWh}$ adicional.
- **¿Para qué sirve?**
  - Da respuesta científica y matemática directa a los Objetivos Específicos 1 y 2.

### FASE 3: Desarrollo de la API REST (Backend)
- **¿Qué haremos?**
  - Programar los controladores y servicios en FastAPI:
    - `POST /api/simulacion/ejecutar`: Ejecuta simulación recibiendo inventario y condiciones climáticas.
    - `GET /api/clima/escenarios`: Lista los meses históricos y permite crear escenarios hipotéticos (ej. "Ola de calor +3°C").
    - `GET /api/tarifas/vigente`: Retorna el pliego de ENDE DELBENI.
    - `PUT /api/tarifas/actualizar`: Panel administrativo para que el sistema no quede obsoleto ante futuros decretos de la AETN.
    - `GET /api/validacion/mape`: Ejecuta el contraste automatizado de los 15 hogares simulados vs. las 150 facturas reales y devuelve la matriz de error porcentual.
- **¿Para qué sirve?**
  - Cumple el Objetivo Específico 3 (Arquitectura lógica y de datos) y brinda la capa de servicios para la interfaz.

### FASE 4: Frontend Web Interactivo y Tablero de Control
- **¿Qué haremos?**
  - Crear una interfaz moderna, limpia e intuitiva:
    - **Panel 1: "Mi Hogar (Inventario)":** Selección visual e intuitiva de aires acondicionados (BTU, horas noche/día), heladeras y focos.
    - **Panel 2: "Simulador de Escenarios":** Selector de mes real de Trinidad (o selector manual de temperatura y humedad).
    - **Panel 3: "Desglose Económico y Factura Proyectada":** Gráfico de aguja del bloque tarifario alcanzado, cálculo exacto en Bs., comparativo mes frío vs. mes caluroso y semáforo de riesgo de sobreconsumo.
    - **Panel 4: "Módulo Científico y Validación (Tribunal View)":** Pestaña especializada para mostrar al tribunal los 15 hogares, las 150 facturas, la comparación curva real vs. curva simulada y el indicador **MAPE global consolidado**.
- **¿Para qué sirve?**
  - Cumple el Objetivo Específico 4 y provee el entregable técnico para la demostración en vivo (Defensa Privada de 60 min y Pública de 15 min exigida por el Art. 28° y 29° del reglamento).

### FASE 5: Calibración Empírica, Auditoría de MAPE y Documento de Grado
- **¿Qué haremos?**
  - Ajuste fino de constantes térmicas para garantizar que el $MAPE < 10\%$.
  - Generación de reportes y gráficas de validación estadística para el Capítulo IV de la tesis.
  - Redacción sincronizada de los Capítulos I, II, III, IV y V según el Art. 15° del Reglamento UABJB.
- **¿Para qué sirve?**
  - Cierra el Objetivo Específico 5, valida formalmente la Hipótesis $H_1$ y genera el documento final para titulación.

---

## 4. MATRIZ DE SINCRONIZACIÓN: SOFTWARE ↔ DOCUMENTO DE GRADO

| Módulo del Software | Artefacto Técnico Entregable | Capítulo del Documento Final (Art. 15°) |
| :--- | :--- | :--- |
| **Modelado Matemático y Facturación** | Fórmulas Rothfusz, matrices de elasticidad térmica y bloques AETN 666/2023. | **Capítulo II: Marco Teórico** (Secciones 2.2, 2.4 y 2.5). |
| **Metodología de Desarrollo** | Backlog de producto, Sprint planning, historias de usuario y criterios de aceptación. | **Capítulo III: Metodología** (Sección 3.6 - Metodología Ágil Scrum). |
| **Base de Datos y Arquitectura** | Diagrama Entidad-Relación, Diccionario de Datos, Diagramas de Arquitectura y Casos de Uso. | **Capítulo IV: Propuesta** (Secciones 4.2 Requerimientos, 4.3 Arquitectura, 4.4 Modelo de Datos). |
| **Interfaz y Despliegue** | Sistema web completo en ejecución local/desplegado y manual de usuario. | **Capítulo IV: Propuesta** (Sección 4.5 Implementación, Manuales en Anexos). |
| **Módulo de Validación** | Cálculo del MAPE de los 15 hogares con tablas y gráficos de dispersión. | **Capítulo IV: Propuesta** (Sección 4.6 Validación) y **Capítulo V: Conclusiones** (Demostración de Hipótesis $H_1$). |
