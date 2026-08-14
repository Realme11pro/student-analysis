from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pyotp
import shutil
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PARENT_FOLDER_ID = "YAHAN_APNE_GOOGLE_DRIVE_FOLDER_KI_ID_DAALEIN"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        token_prefix = "fake-jwt-token-for-"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        token = authorization.split(" ")[1]
        if not token.startswith(token_prefix):
            raise HTTPException(status_code=401, detail="Invalid token structure")
            
        email = token.replace(token_prefix, "")
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

class UserSignup(BaseModel):
    full_name: str
    email: str
    phone: str
    dob: str
    gender: str
    college: str
    course: str
    semester: str
    roll_no: str
    password: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ResetPasswordModel(BaseModel):
    email: str
    otp: str
    new_password: str

class GoalCreate(BaseModel):
    title: str

class TaskCreate(BaseModel):
    title: str
    goal_id: int = None

class ResourceCreate(BaseModel):
    title: str
    link: str
    category: str = "Google Drive"

class NoteCreate(BaseModel):
    title: str
    content: str

class DeadlineCreate(BaseModel):
    title: str
    date: str

@app.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered!")
    
    existing_roll = db.query(models.User).filter(models.User.roll_no == user.roll_no).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll Number already registered!")

    secret_key = pyotp.random_base32()

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        dob=user.dob,
        gender=user.gender,
        college=user.college,
        course=user.course,
        semester=user.semester,
        roll_no=user.roll_no,
        hashed_password=user.password,
        totp_secret=secret_key
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    default_habits = ["Daily Reading", "Practice Coding", "Exercise", "Sleep 8 Hours"]
    for h in default_habits:
        db.add(models.Habit(title=h, is_done=False, user_id=new_user.id))
    db.commit()

    return {
        "message": "Account created successfully!",
        "totp_secret": secret_key
    }

@app.post("/login-request-otp")
def login_request_otp(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or user.hashed_password != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"message": "Password verified. Please enter Google Authenticator code."}

@app.post("/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not user.totp_secret:
        raise HTTPException(status_code=404, detail="User or Authenticator setup not found.")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.otp):
        raise HTTPException(status_code=400, detail="Invalid Authenticator Code.")

    access_token = f"fake-jwt-token-for-{data.email}"
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": data.email,
        "full_name": user.full_name
    }

@app.post("/forgot-password-request")
def forgot_password_request(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist.")
    return {"message": "Please use your Google Authenticator code to reset password."}

@app.post("/reset-password")
def reset_password(data: ResetPasswordModel, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.otp):
        raise HTTPException(status_code=400, detail="Invalid Authenticator Code.")

    user.hashed_password = data.new_password
    db.commit()
    return {"message": "Password updated successfully!"}

@app.delete("/delete-account")
def delete_account(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    db.delete(user)
    db.commit()
    return {"message": "Account deleted successfully!"}

@app.get("/goals/search/")
def search_goals(query: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Query se match karne wale goals dhundhein
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == current_user.id,
        models.Goal.title.contains(query) # Title mein search karega
    ).all()
    return [{"id": g.id, "title": g.title} for g in goals]

@app.get("/habits")
def get_habits(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    habits = db.query(models.Habit).filter(models.Habit.user_id == current_user.id).all()
    
    # Agar user ki ek bhi habit nahi hai, toh default habits apne aap add ho jayengi
    if not habits:
        default_habits = ["Daily Reading", "Practice Coding", "Exercise", "Sleep 8 Hours"]
        for h in default_habits:
            new_habit = models.Habit(title=h, is_done=False, user_id=current_user.id)
            db.add(new_habit)
        db.commit()
        habits = db.query(models.Habit).filter(models.Habit.user_id == current_user.id).all()

    return [{"id": h.id, "title": h.title, "is_done": h.is_done} for h in habits]

@app.get("/goals/search/")
async def search_goals(query: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Goal).filter(models.Goal.user_id == current_user.id, models.Goal.title.contains(query)).all()

@app.get("/analytics")
def get_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).count()
    total_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).count()
    completed_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id, models.Task.is_completed == True).count()
    return {"total_goals": total_goals, "total_tasks": total_tasks, "completed_tasks": completed_tasks}

@app.get("/goals")
def get_goals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    return [{"id": g.id, "title": g.title} for g in goals]

@app.post("/goals")
def create_goal(goal: GoalCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_goal = models.Goal(title=goal.title, user_id=current_user.id)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {"message": "Goal added successfully!", "goal": {"id": new_goal.id, "title": new_goal.title}}

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    db.delete(goal)
    db.commit()
    return {"message": f"Goal {goal_id} deleted successfully!"}

@app.get("/tasks")
def get_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    return [{"id": t.id, "title": t.title, "is_completed": t.is_completed, "goal_id": t.goal_id} for t in tasks]

@app.post("/tasks")
def create_task(task: TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_task = models.Task(title=task.title, goal_id=task.goal_id, user_id=current_user.id, is_completed=False)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"message": "Task added successfully!", "task": {"id": new_task.id, "title": new_task.title, "is_completed": new_task.is_completed}}

@app.put("/tasks/{task_id}/toggle")
def toggle_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    task.is_completed = not task.is_completed
    db.commit()
    return {"message": "Task status updated!", "is_completed": task.is_completed}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully!"}

@app.get("/resources")
def get_resources(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resources = db.query(models.Resource).filter(models.Resource.user_id == current_user.id).all()
    return [{"id": r.id, "title": r.title, "link": r.link, "category": r.category} for r in resources]

@app.post("/resources")
def create_resource(res: ResourceCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_res = models.Resource(title=res.title, link=res.link, category=res.category, user_id=current_user.id)
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    return {"message": "Resource added successfully!", "resource": {"id": new_res.id, "title": new_res.title, "link": new_res.link}}

@app.post("/upload-to-google-drive")
async def upload_to_google_drive(
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        SERVICE_ACCOUNT_FILE = 'credentials.json'
        
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        service = build('drive', 'v3', credentials=creds)
        
        file_metadata = {
            'name': title,
            'parents': [PARENT_FOLDER_ID]
        }
        media = MediaFileUpload(temp_file_path, resumable=True)
        
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        file_link = uploaded_file.get('webViewLink')
        
        new_res = models.Resource(title=title, link=file_link, category=category, user_id=current_user.id)
        db.add(new_res)
        db.commit()
        
        os.remove(temp_file_path)
        return {"message": "File uploaded successfully!", "link": file_link}
        
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/resources/{res_id}")
def delete_resource(res_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    res = db.query(models.Resource).filter(models.Resource.id == res_id, models.Resource.user_id == current_user.id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found.")
    db.delete(res)
    db.commit()
    return {"message": "Resource deleted successfully!"}

@app.get("/habits")
def get_habits(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    habits = db.query(models.Habit).filter(models.Habit.user_id == current_user.id).all()
    return [{"id": h.id, "title": h.title, "is_done": h.is_done} for h in habits]

@app.put("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    habit.is_done = not habit.is_done
    db.commit()
    return {"message": "Habit updated!", "is_done": habit.is_done}

@app.get("/notes")
def get_notes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter(models.Note.user_id == current_user.id).all()
    return [{"id": n.id, "title": n.title, "content": n.content} for n in notes]

@app.post("/notes")
def create_note(note: NoteCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_note = models.Note(title=note.title, content=note.content, user_id=current_user.id)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return {"message": "Note saved successfully!"}

@app.get("/deadlines")
def get_deadlines(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    deadlines = db.query(models.Deadline).filter(models.Deadline.user_id == current_user.id).all()
    return [{"id": d.id, "title": d.title, "date": d.date} for d in deadlines]

@app.post("/deadlines")
def create_deadline(dl: DeadlineCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_dl = models.Deadline(title=dl.title, date=dl.date, user_id=current_user.id)
    db.add(new_dl)
    db.commit()
    db.refresh(new_dl)
    return {"message": "Deadline added successfully!"}