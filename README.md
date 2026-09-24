# ToolGuard AI — Intelligent Tool Wear Prediction for Smart CNC Manufacturing

[![CNC Predictive Maintenance](https://img.shields.io/badge/Domain-Smart_Manufacturing_Predictive_Maintenance-0ea5e9.svg)](https://github.com)
[![Model](https://img.shields.io/badge/Model-XGBoost_Regressor-10b981.svg)](https://xgboost.readthedocs.io)
[![Explainability](https://img.shields.io/badge/XAI-Tree_SHAP-f59e0b.svg)](https://shap.readthedocs.io)
[![GenAI](https://img.shields.io/badge/Assistant-Gemini_3.8_Flash-8b5cf6.svg)](https://ai.google.dev)
[![Architecture](https://img.shields.io/badge/Frontend-React_19_TypeScript_Tailwind-38bdf8.svg)](https://vitejs.dev)

---

## 1. PROJECT OVERVIEW & PROBLEM STATEMENT

Cutting-tool wear in Computer Numerical Control (CNC) milling operations is one of the leading root causes of dimensional inaccuracies, deteriorated surface roughness ($R_a$), workpiece scrap, and catastrophic tool failure. Premature tool replacement leads to exorbitant tooling expenses, while running excessively worn tools causes sudden cutter breakage, spindle damage, and unscheduled production halts.

**ToolGuard AI** is an intelligent predictive-maintenance decision-support system engineered for smart CNC manufacturing. By synthesizing multi-sensor telemetry—specifically high-frequency **Cutting Force ($F_x, F_y, F_z$)**, **Vibration accelerations ($V_x, V_y, V_z$)**, and **Acoustic Emission (AE)**—alongside operational machining parameters (spindle speed, feed rate, axial depth of cut), ToolGuard AI predicts continuous tool flank wear ($V_B$ in millimeters) using a trained **XGBoost Regressor** and decodes model decisions via **Tree SHAP (SHapley Additive exPlanations)**.

Integrated with **Google Gemini 3.8 Flash**, the platform delivers context-grounded root-cause insights and ISO-compliant maintenance recommendations directly to shop-floor manufacturing engineers.

---

## 2. ACADEMIC & RESEARCH OBJECTIVES

1. **Predictive Machine Learning**: Implement a high-fidelity regression pipeline using Gradient Boosted Decision Trees (XGBoost) to accurately model non-linear cutting tool degradation across initial break-in, steady-state wear, and accelerated tertiary wear phases.
2. **Phenomenological Correlation**: Establish quantitative relationships between dynamic sensor signatures (Root Mean Square force and vibration power spectral density) and physical flank wear.
3. **Local & Global Explainability**: Apply Shapley Additive exPlanations (`shap.TreeExplainer`) to eliminate the "black-box" nature of tree ensembles, attributing positive and negative wear drivers to specific sensor channels.
4. **Actionable Decision Support**: Automate health state classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with configurable wear boundaries and Remaining Useful Life (RUL) cycle projections.
5. **Generative AI Copilot**: Ground Gemini LLM with structured machine telemetry for conversational diagnostic troubleshooting without hallucinating sensor values.

---

## 3. SYSTEM ARCHITECTURE

```
                                  [ CNC Milling Machine ]
                                             │
                   ┌─────────────────────────┼─────────────────────────┐
                   ▼                         ▼                         ▼
            Dynamometer (Force)    Accelerometer (Vib)        AE Sensor (Acoustic)
                   │                         │                         │
                   └─────────────────────────┼─────────────────────────┘
                                             ▼
                             [ Sensor Data Ingestion / CSV ]
                                             │
                                             ▼
                             [ Data Preprocessing & Cleaning ]
                        • Median Imputation   • Outlier Removal (IQR)
                        • Deduplication       • Strict Causal Windowing
                                             │
                                             ▼
                             [ Feature Engineering Pipeline ]
                        • RMS Force/Vib       • Rolling Mean & Std (t - k)
                        • Machining Energy    • Peak-to-Peak Range
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
           [ 80% Train Partition ]                       [ 20% Test Partition ]
                      │                                             │
                      ▼                                             │
         [ XGBoost Regressor Fit ]                                  │
         • n_estimators=300, depth=6                                │
         • learning_rate=0.05                                       │
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             ▼
                                [ Model Validation Metrics ]
                                • MAE  • RMSE  • R² Score
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          [ Inference Engine (Predict) ]                 [ Tree SHAP Explainer ]
          • Flank Wear VB (mm)                           • Feature Attributions
          • RUL Projections                              • Root Cause Analysis
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             │
                                             ▼
                             [ Tool Health Classification ]
                       • LOW    (<0.10mm)    • HIGH    (0.20-0.30mm)
                       • MEDIUM (0.10-0.20)  • CRITICAL (>0.30mm)
                                             │
                                             ▼
                               [ Gemini 3.8 Copilot & API ]
                       • Natural Language Maintenance Reports
                       • Telemetry-Grounded Diagnostics
                                             │
                                             ▼
                                [ React Industrial Dashboard ]
```

---

## 4. TECHNOLOGY STACK

### Frontend
- **Framework**: React 19, TypeScript
- **Bundler & Server**: Vite 8, Express 4 with middleware integration
- **Styling**: Tailwind CSS v4 (Industrial Dark High-Tech Theme)
- **Visualizations**: Recharts (Dynamic multi-sensor charts, wear progression, SHAP bar charts, actual vs predicted scatter, residual distributions)
- **Icons**: Lucide React

### Backend
- **Node/TypeScript Runtime**: Express 4, `@google/genai` v2.4, TreeSHAP exact DP implementation, Gradient Boosted regression
- **Python / FastAPI Standalone**: FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, XGBoost, SHAP, Joblib, SQLAlchemy, SQLite
- **AI Layer**: Google Gemini 3.8 Flash (`gemini-3.8-flash`)

---

## 5. DATASET INFORMATION: PHM 2010 CNC MILLING

The system is calibrated around the benchmark **PHM Society 2010 Prognostics Challenge CNC Milling Machine Dataset**:
- **Workpiece Material**: Inconel 718 (superalloy with high thermal resistance and work-hardening characteristics).
- **Cutter**: 3-flute ball nose carbide cutter (diameter 6mm).
- **Sensors**:
  - 3-component piezoelectric dynamometer (Kistler 9265B) measuring cutting forces $F_x, F_y, F_z$.
  - 3-axis accelerometer (Kistler 8636C) recording vibrations $V_x, V_y, V_z$.
  - Acoustic emission acoustic sensor (Kistler 8152B).
- **Target Variable**: Flank wear $V_B$ in millimeters measured via microscope after sequential cutting passes.

The application includes an automatic column detection and mapping system that supports alternate column nomenclature (`force`, `cutting_force`, `smcAC`, `smcDC`, `vibration`, `vib_table`, `AE_RMS`, `tool_wear`, `flute_wear`, `feed_rate`, `spindle_speed`, etc.).

---

## 6. INSTALLATION & USAGE GUIDE

### Prerequisites
- Node.js 18+ (or 20+)
- Python 3.10+ (if running Python backend)

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/your-username/toolguard-ai.git
cd toolguard-ai
cp .env.example .env
```
Add your Gemini API Key in `.env`:
```env
GEMINI_API_KEY="your_actual_gemini_api_key"
PORT=3000
```

### Step 2: Running Full-Stack Web Application (Node + Vite)
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### Step 3: (Optional) Running Python FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 7. COLLEGE PROJECT DEMONSTRATION WORKFLOW

Follow this 8-step workflow for academic reviews or viva evaluations:

1. **Dashboard Overview**: Review real-time CNC machine online status, current tool metrics, sensor telemetry trends, and prediction history.
2. **Data Upload**:
   - Navigate to **Data Upload**.
   - Either drag-and-drop a CSV dataset, OR click **"Load Realistic PHM 2010 Sample Dataset"** for instant testing.
   - Review column validation, missing values, duplicates, and column mapping.
3. **Data Preprocessing & Feature Engineering**:
   - Trigger the pipeline to generate rolling RMS, standard deviations, and energy indices.
4. **XGBoost Model Training**:
   - Navigate to **Model Performance** or **Data Upload**.
   - Click **"Train XGBoost Regressor"**.
   - Observe genuine test set evaluation metrics ($R^2$, MAE, RMSE), Actual vs. Predicted plots, and Residual distributions.
5. **Tool Wear Prediction**:
   - Navigate to **Prediction**.
   - Input custom sensor parameters (Cutting Force, Vibration, AE, Speed, Feed) or select pre-configured wear presets.
   - Click **"Predict Tool Wear"** to observe live model calculation and Remaining Useful Life (RUL) estimation.
6. **SHAP Explainability**:
   - Navigate to **Explainability**.
   - Examine the Tree SHAP waterfall and horizontal bar chart illustrating which sensor features drove the prediction upward or downward.
7. **Predictive Maintenance Advisory**:
   - Navigate to **Maintenance**.
   - Inspect the health state risk band (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Click **"Generate AI Maintenance Report"** to produce an ISO-style maintenance report.
8. **ToolGuard Copilot**:
   - Open **AI Assistant** and ask technical questions such as:
     - *"Why is cutting force the dominant wear indicator?"*
     - *"What does a positive SHAP value indicate?"*
     - *"Explain the latest prediction for Tool T01."*

---

## 8. FUTURE ARCHITECTURAL ENHANCEMENTS

- **Recurrent & Attention Time-Series**: Integration of Bidirectional LSTM and Temporal Fusion Transformers for sequence degradation modeling.
- **Autoencoder Anomaly Detection**: Unsupervised reconstruction error thresholds for novel tool chipping detection.
- **Industrial Protocols**: Native OPC-UA and MQTT drivers for edge industrial gateways (Siemens Sinumerik, Fanuc FOCAS).
- **Physical Digital Twin**: Finite Element Modeling (FEM) coupling for temperature gradient estimations at tool-chip interfaces.

---

## 9. AUTHORS & CITATION

**Developed for**: Smart Manufacturing Predictive Maintenance Research & Final Year Engineering Capstone.  
**Dataset Reference**: NASA Ames Prognostics Center of Excellence (PHM 2010 Milling Challenge Dataset).
