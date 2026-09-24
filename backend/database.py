from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
from .config import settings

engine = create_engine(settings.SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    tool_id = Column(String(64), index=True)
    cycle = Column(Integer)
    cutting_force = Column(Float)
    vibration = Column(Float)
    acoustic_emission = Column(Float)
    spindle_speed = Column(Float)
    feed_rate = Column(Float)
    depth_of_cut = Column(Float)
    predicted_wear = Column(Float)
    risk_level = Column(String(32))
    tool_health = Column(String(64))
    model_version = Column(String(32), default="XGBoost-1.7")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(256))
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    row_count = Column(Integer)
    column_count = Column(Integer)
    columns_json = Column(Text)

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    mae = Column(Float)
    rmse = Column(Float)
    r2 = Column(Float)
    feature_count = Column(Integer)
    train_samples = Column(Integer)
    test_samples = Column(Integer)
    model_path = Column(String(256))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
