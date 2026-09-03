import os
import sys
import streamlit as st
import joblib
import mysql.connector
import sqlite3
import pandas as pd
import plotly.express as px
from sklearn.feature_extraction.text import TfidfVectorizer

# ==============================================================================
# 🛠️ STEP 1: DYNAMIC ENVIRONMENT PATH RESOLUTION (PYINSTALLER COMPATIBILITY)
# ==============================================================================
if hasattr(sys, '_MEIPASS'):
    # Primary: Check PyInstaller's core unpacked data directory (_internal folder)
    base_dir = sys._MEIPASS
    
    # Fallback: If for any reason files are missing there, check next to the .exe
    if not os.path.exists(os.path.join(base_dir, "finance_model.pkl")):
        base_dir = os.path.dirname(sys.executable)
else:
    # Development: Running normally in your VS Code workspace
    base_dir = os.path.dirname(os.path.abspath(__file__))

# Map absolute, reliable pointer coordinates to your ML file streams
MODEL_PATH = os.path.join(base_dir, "finance_model.pkl")
VECTORIZER_PATH = os.path.join(base_dir, "vectorizer.pkl")

# ==============================================================================
# 🧠 STEP 2: MACHINE LEARNING INITIALIZATION INTERFACE
# ==============================================================================
@st.cache_resource
def load_ml_pipeline():
    """Dynamically loads packaged ML models, failing gracefully if files are missing."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        return None, None
    try:
        loaded_model = joblib.load(MODEL_PATH)
        loaded_vectorizer = joblib.load(VECTORIZER_PATH)
        return loaded_model, loaded_vectorizer
    except Exception:
        return None, None

model, vectorizer = load_ml_pipeline()

# ==============================================================================
# 🗄️ STEP 3: DATABASE BACKEND (MYSQL PRODUCTION WITH SQLITE ARCHITECTURE FALLBACK)
# ==============================================================================
def init_database_connection():
    """
    Attempts connection to your active production XAMPP MySQL environment.
    Falls back gracefully to an internal local SQLite ledger file if server is offline.
    """
    try:
        # Try connecting to active local XAMPP relational server
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="finance_db",
            connect_timeout=3
        )
        return connection, "MySQL (XAMPP Server)"
    except Exception:
        # Graceful storage degradation framework switch
        sqlite_path = os.path.join(base_dir, "finance.db")
        connection = sqlite3.connect(sqlite_path, check_same_thread=False)
        return connection, "Local SQLite Core (Backup Mode)"

# Initialize connection and global variables BEFORE creating schemas or layouts
db_conn, db_engine_name = init_database_connection()

def setup_database_schema():
    """Initializes standard master ledger tables if they don't exist yet."""
    cursor = db_conn.cursor()
    
    # Clean split between MySQL syntax and SQLite syntax
    if "MySQL" in db_engine_name:
        create_table_query = """
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date TEXT,
            description TEXT,
            amount DOUBLE,
            category TEXT
        ) ENGINE=InnoDB;
        """
    else:
        # Fix: SQLite requires 'AUTOINCREMENT' without an underscore
        create_table_query = """
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            description TEXT,
            amount REAL,
            category TEXT
        );
        """
        
    try:
        cursor.execute(create_table_query)
        db_conn.commit()
    except Exception as e:
        print(f"Database schema init error: {e}")
    finally:
        cursor.close()

# Execute schema creation 
setup_database_schema()

# ==============================================================================
# 🎨 STEP 4: STREAMLIT ENTERPRISE UI INTERFACE LAYOUT
# ==============================================================================
st.set_page_config(page_title="FinAI Advanced Enterprise Tracker", layout="wide")

st.title("💼 FinAI - Advanced Enterprise Tracker")
st.caption(f"Connected Database Layer Engine: **{db_engine_name}**")

# Standard System Error Handling Check
if model is None or vectorizer is None:
    st.error("❌ Machine Learning pipeline binaries missing. Please ensure your models are trained and present.")
    st.stop()

# Create layout compartments
col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("📥 Log New Transaction Entry")
    with st.form("transaction_form", clear_on_submit=True):
        tx_date = st.date_input("Transaction Date")
        tx_desc = st.text_input("Transaction Reference / Description (e.g., Swiggy, Gym, Netflix)")
        tx_amount = st.number_input("Transaction Value Amount (₹)", min_value=0.0, step=10.0)
        
        submit = st.form_submit_button("Analyze & Audit Entry")
        
        if submit and tx_desc:
            # 🚀 Execute ML Classification Engine Realtime
            features = vectorizer.transform([tx_desc])
            predicted_category = model.predict(features)[0]
            
            # Save Record directly down to our active database adapter tier
            cursor = db_conn.cursor()
            insert_query = "INSERT INTO transactions (date, description, amount, category) VALUES (%s, %s, %s, %s)" \
                if "MySQL" in db_engine_name else "INSERT INTO transactions (date, description, amount, category) VALUES (?, ?, ?, ?)"
            
            cursor.execute(insert_query, (str(tx_date), tx_desc, tx_amount, predicted_category))
            db_conn.commit()
            cursor.close()
            
            st.success(f"Successfully processed! AI categorized this item as: **{predicted_category}**")

with col2:
    st.subheader("📊 Master Audit Database Ledger")
    
    # Extract records directly out from database stream layer
    query = "SELECT date, description, amount, category FROM transactions ORDER BY id DESC"
    try:
        df = pd.read_sql(query, db_conn)
    except Exception:
        df = pd.DataFrame(columns=["date", "description", "amount", "category"])
        
    if not df.empty:
        # Display tracking overview metrics
        total_spent = df["amount"].sum()
        st.metric(label="Total Outflow Volume Asset Tracked", value=f"₹{total_spent:,.2f}")
        
        # Interactive UI Grid Display
        st.dataframe(df, use_container_width=True)
        
        # Plotly Metrics Generation
        st.subheader("💡 Spending Resource Allocation Breakdown")
        fig = px.pie(df, values='amount', names='category', hole=0.4,
                     color_discrete_sequence=px.colors.sequential.RdBu)
        fig.update_layout(margin=dict(t=20, b=20, l=20, r=20))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No audit logs saved inside the current database engine stream repository yet.")