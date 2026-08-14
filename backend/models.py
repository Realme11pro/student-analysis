from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    dob = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    college = Column(String(150), nullable=False)
    course = Column(String(100), nullable=False)
    semester = Column(String(50), nullable=False)
    roll_no = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    totp_secret = Column(String(100), nullable=True)
    
    goals = relationship("Goal", back_populates="owner", cascade="all, delete")
    tasks = relationship("Task", back_populates="owner", cascade="all, delete")
    resources = relationship("Resource", back_populates="owner", cascade="all, delete")
    habits = relationship("Habit", back_populates="owner", cascade="all, delete")

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="goals")
    tasks = relationship("Task", back_populates="goal", cascade="all, delete")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True)
    is_completed = Column(Boolean, default=False)
    goal_id = Column(Integer, ForeignKey("goals.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    goal = relationship("Goal", back_populates="tasks")
    owner = relationship("User", back_populates="tasks")

class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    link = Column(String(300), nullable=False)
    category = Column(String(50), default="Google Drive")
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="resources")

class Habit(Base):
    __tablename__ = "habits"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    is_done = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="habits")