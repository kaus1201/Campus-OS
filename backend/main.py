"""
Campus OS — FastAPI Backend
All API endpoints for Attendance, Notes, Notice Board, and Community.
"""
import math
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from database import get_db, init_db
from ollama_client import summarise_note, suggest_tags, tag_chat


# ── Lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Campus OS", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ───────────────────────────────────────
class SubjectCreate(BaseModel):
    name: str
    present: int = 0
    total: int = 0
    target: float = 85.0


class SubjectAction(BaseModel):
    action: str  # "attend", "skip", "reset"


class NoteCreate(BaseModel):
    title: str
    content: str
    tags: str = ""  # comma-separated


class TagChatRequest(BaseModel):
    tag: str
    message: str
    history: list[dict] = []


class NoticeCreate(BaseModel):
    title: str
    body: str
    author: str = "Anonymous"


class MessageCreate(BaseModel):
    sender: str
    content: str


class TimetableCreate(BaseModel):
    subject_id: int
    day_of_week: str
    start_time: str
    end_time: str


# ── Helpers ───────────────────────────────────────────────
def row_to_dict(row) -> dict:
    """Convert an aiosqlite Row to a plain dict."""
    if row is None:
        return {}
    return dict(row)


def compute_attendance_stats(present: int, total: int, target: float) -> dict:
    """Compute percentage, can_skip, need_attend for a subject."""
    if total == 0:
        return {"percentage": 0.0, "can_skip": 0, "need_attend": 0, "status": "safe"}

    pct = (present / total) * 100
    target_frac = target / 100.0

    if pct >= target:
        denom = 1 - target_frac
        can_skip = math.floor((present - target_frac * total) / denom) if denom > 0 else 0
        can_skip = max(0, can_skip)
        need_attend = 0
    else:
        denom = 1 - target_frac
        need_attend = math.ceil((target_frac * total - present) / denom) if denom > 0 else 0
        need_attend = max(0, need_attend)
        can_skip = 0

    # Status: green if >= target, yellow if within 5% below, red if > 5% below
    if pct >= target:
        status = "safe"
    elif pct >= target - 5:
        status = "warning"
    else:
        status = "danger"

    return {
        "percentage": round(pct, 1),
        "can_skip": can_skip,
        "need_attend": need_attend,
        "status": status,
    }


# ══════════════════════════════════════════════════════════
#  SUBJECTS (Attendance)
# ══════════════════════════════════════════════════════════

@app.get("/subjects")
async def list_subjects(db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall("SELECT * FROM subjects ORDER BY created_at DESC")
    subjects = []
    for r in rows:
        d = row_to_dict(r)
        stats = compute_attendance_stats(d["present"], d["total"], d["target"])
        d.update(stats)
        subjects.append(d)
    return subjects


@app.post("/subjects", status_code=201)
async def create_subject(body: SubjectCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO subjects (name, present, total, target, original_present, original_total) VALUES (?, ?, ?, ?, ?, ?)",
        (body.name, body.present, body.total, body.target, body.present, body.total),
    )
    await db.commit()
    row = await db.execute_fetchall("SELECT * FROM subjects WHERE id = ?", (cursor.lastrowid,))
    d = row_to_dict(row[0])
    d.update(compute_attendance_stats(d["present"], d["total"], d["target"]))
    return d


@app.patch("/subjects/{subject_id}")
async def update_subject(subject_id: int, body: SubjectAction, db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall("SELECT * FROM subjects WHERE id = ?", (subject_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject = row_to_dict(rows[0])

    if body.action == "attend":
        await db.execute(
            "UPDATE subjects SET present = present + 1, total = total + 1 WHERE id = ?",
            (subject_id,),
        )
    elif body.action == "skip":
        await db.execute(
            "UPDATE subjects SET total = total + 1 WHERE id = ?",
            (subject_id,),
        )
    elif body.action == "reset":
        await db.execute(
            "UPDATE subjects SET present = original_present, total = original_total WHERE id = ?",
            (subject_id,),
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {body.action}")

    await db.commit()

    rows = await db.execute_fetchall("SELECT * FROM subjects WHERE id = ?", (subject_id,))
    d = row_to_dict(rows[0])
    d.update(compute_attendance_stats(d["present"], d["total"], d["target"]))
    return d


@app.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM subjects WHERE id = ?", (subject_id,))
    await db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════
#  TIMETABLE
# ══════════════════════════════════════════════════════════

@app.get("/timetable")
async def list_timetable(db: aiosqlite.Connection = Depends(get_db)):
    query = """
        SELECT t.*, s.name as subject_name, s.target as subject_target 
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        ORDER BY 
          CASE day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END ASC, 
          t.start_time ASC
    """
    rows = await db.execute_fetchall(query)
    return [row_to_dict(r) for r in rows]


@app.post("/timetable", status_code=201)
async def create_timetable_entry(body: TimetableCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO timetable (subject_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
        (body.subject_id, body.day_of_week, body.start_time, body.end_time),
    )
    await db.commit()
    
    # Return the created entry joined with subject
    query = """
        SELECT t.*, s.name as subject_name, s.target as subject_target 
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE t.id = ?
    """
    rows = await db.execute_fetchall(query, (cursor.lastrowid,))
    return row_to_dict(rows[0])


@app.delete("/timetable/{entry_id}")
async def delete_timetable_entry(entry_id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM timetable WHERE id = ?", (entry_id,))
    await db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════
#  NOTES
# ══════════════════════════════════════════════════════════

@app.get("/notes")
async def list_notes(tag: Optional[str] = None, db: aiosqlite.Connection = Depends(get_db)):
    if tag:
        # SQLite LIKE for comma-separated tags
        rows = await db.execute_fetchall(
            """SELECT * FROM notes
               WHERE ',' || tags || ',' LIKE ?
               ORDER BY updated_at DESC""",
            (f"%,{tag.strip().lower()},%",),
        )
    else:
        rows = await db.execute_fetchall("SELECT * FROM notes ORDER BY updated_at DESC")
    return [row_to_dict(r) for r in rows]


@app.post("/notes", status_code=201)
async def create_note(body: NoteCreate, db: aiosqlite.Connection = Depends(get_db)):
    # Parse manual tags
    manual_tags = [t.strip().lower() for t in body.tags.split(",") if t.strip()]

    # Auto-suggest tags via Ollama
    suggested = await suggest_tags(body.title, body.content, manual_tags)

    # Merge and deduplicate
    all_tags = list(dict.fromkeys(manual_tags + suggested))  # preserves order, removes dupes
    tags_str = ",".join(all_tags)

    cursor = await db.execute(
        "INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)",
        (body.title, body.content, tags_str),
    )
    await db.commit()

    rows = await db.execute_fetchall("SELECT * FROM notes WHERE id = ?", (cursor.lastrowid,))
    return row_to_dict(rows[0])


@app.delete("/notes/{note_id}")
async def delete_note(note_id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    await db.commit()
    return {"ok": True}


@app.post("/notes/{note_id}/summarise")
async def summarise_note_endpoint(note_id: int, db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall("SELECT * FROM notes WHERE id = ?", (note_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Note not found")

    note = row_to_dict(rows[0])
    summary = await summarise_note(note["title"], note["content"])

    await db.execute("UPDATE notes SET summary = ? WHERE id = ?", (summary, note_id))
    await db.commit()

    return {"summary": summary}


# ══════════════════════════════════════════════════════════
#  TAG-SCOPED AI CHAT
# ══════════════════════════════════════════════════════════

@app.post("/chat/tag")
async def chat_with_tag(body: TagChatRequest, db: aiosqlite.Connection = Depends(get_db)):
    # Fetch all notes with this tag
    rows = await db.execute_fetchall(
        """SELECT * FROM notes
           WHERE ',' || tags || ',' LIKE ?
           ORDER BY updated_at DESC""",
        (f"%,{body.tag.strip().lower()},%",),
    )

    if not rows:
        return {"reply": f"No notes found with tag '{body.tag}'. Add some notes first!"}

    # Build context from notes
    notes_context = ""
    for r in rows:
        n = row_to_dict(r)
        notes_context += f"### {n['title']}\n{n['content']}\n\n"

    reply = await tag_chat(body.tag, notes_context, body.message, body.history)
    return {"reply": reply}


# ══════════════════════════════════════════════════════════
#  NOTICE BOARD
# ══════════════════════════════════════════════════════════

@app.get("/noticeboard")
async def list_notices(db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall(
        "SELECT * FROM notices ORDER BY pinned DESC, created_at DESC"
    )
    return [row_to_dict(r) for r in rows]


@app.post("/noticeboard", status_code=201)
async def create_notice(body: NoticeCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO notices (title, body, author) VALUES (?, ?, ?)",
        (body.title, body.body, body.author),
    )
    await db.commit()
    rows = await db.execute_fetchall("SELECT * FROM notices WHERE id = ?", (cursor.lastrowid,))
    return row_to_dict(rows[0])


@app.patch("/noticeboard/{notice_id}/pin")
async def toggle_pin(notice_id: int, db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall("SELECT * FROM notices WHERE id = ?", (notice_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Notice not found")
    current = row_to_dict(rows[0])
    new_pinned = 0 if current["pinned"] else 1
    await db.execute("UPDATE notices SET pinned = ? WHERE id = ?", (new_pinned, notice_id))
    await db.commit()
    rows = await db.execute_fetchall("SELECT * FROM notices WHERE id = ?", (notice_id,))
    return row_to_dict(rows[0])


# ══════════════════════════════════════════════════════════
#  COMMUNITY CHAT
# ══════════════════════════════════════════════════════════

@app.get("/community")
async def list_messages(db: aiosqlite.Connection = Depends(get_db)):
    rows = await db.execute_fetchall(
        "SELECT * FROM messages ORDER BY created_at ASC"
    )
    return [row_to_dict(r) for r in rows]


@app.post("/community", status_code=201)
async def send_message(body: MessageCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO messages (sender, content) VALUES (?, ?)",
        (body.sender, body.content),
    )
    await db.commit()
    rows = await db.execute_fetchall("SELECT * FROM messages WHERE id = ?", (cursor.lastrowid,))
    return row_to_dict(rows[0])
