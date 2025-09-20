import sqlite3
from typing import List, Set
from fastapi import Depends, FastAPI, HTTPException, status
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from server.app_types import TaskForm, TaskUpdate, TasksRead, TasksResponse

db_path = Path(__file__).parent.joinpath("tasks.db")


def get_db():
    conn = sqlite3.Connection(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        conn.close()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://task-tracker-eight-xi.vercel.app",
        "https://vercel.com/michaelalexanderdentons-projects/task-tracker/8bFpqW6NYqeqFMWAwb6VgxKSs8f8",
    ],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)


@app.get("/ping")
def wait_for_server():
    return JSONResponse(content={"status": "ok"}, status_code=status.HTTP_200_OK)


@app.get("/tasks", response_model=TasksResponse)
def get_all_notes(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    data = cursor.execute("SELECT * FROM tasks ORDER BY created DESC").fetchall()
    return TasksResponse(success=True, tasks=[TasksRead(**dict(row)) for row in data])


@app.post("/add", response_model=TasksRead)
def create_task(task: TaskForm, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO tasks (task) VALUES (?) RETURNING *", (task.task,))
    added_task = cursor.fetchone()
    if cursor.lastrowid == 0:
        raise HTTPException(
            detail="Could not add your task.", status_code=status.HTTP_401_UNAUTHORIZED
        )
    return TasksRead(**dict(added_task))


@app.delete("/delete/{task_id}")
def delete_task(task_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    stmt = "DELETE FROM tasks WHERE id = (?)"
    cursor.execute(stmt, (task_id,))
    if cursor.rowcount == 0:
        raise HTTPException(
            detail="Task was not found", status_code=status.HTTP_404_NOT_FOUND
        )
    return {"status": "ok"}


class BatchDelete(BaseModel):
    ids: set[str]


@app.delete("/batch/delete")
def batch_delete(data: BatchDelete, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    placeholders = ", ".join("?" for _ in data.ids)
    stmt = f"DELETE FROM tasks WHERE id IN ({placeholders}) RETURNING id"
    print(stmt)
    print(data)
    cursor.execute(stmt, (*data.ids,))
    rows = cursor.fetchall()
    ids = [row[0] for row in rows]
    return JSONResponse(content={"ids": ids}, status_code=status.HTTP_200_OK)


@app.patch("/update/{task_id}")
def update_task(
    task_id: int, to_update: TaskUpdate, db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE tasks SET task = ?, completed = ? WHERE id = ?",
        (
            to_update.task,
            to_update.completed,
            task_id,
        ),
    )
    if cursor.rowcount == 0:
        raise HTTPException(
            detail="No task was found!", status_code=status.HTTP_404_NOT_FOUND
        )
    return {"status": "ok"}
