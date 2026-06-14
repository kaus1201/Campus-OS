"""
Campus OS — SQLite Database Layer
Auto-creates tables and seeds sample data on first run.
"""
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "campus_os.db")


async def get_db():
    """Yield an aiosqlite connection (used as FastAPI dependency)."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    """Create tables if they don't exist and insert seed data."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")

    # ── Tables ────────────────────────────────────────────────
    await db.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            present INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL DEFAULT 0,
            target REAL NOT NULL DEFAULT 85.0,
            original_present INTEGER NOT NULL DEFAULT 0,
            original_total INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '',
            summary TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            author TEXT NOT NULL DEFAULT 'Anonymous',
            pinned INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await db.execute("""
        CREATE TABLE IF NOT EXISTS timetable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            day_of_week TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )
    """)

    # ── Seed data (only if tables are empty) ──────────────────
    row = await db.execute_fetchall("SELECT COUNT(*) as c FROM subjects")
    if row[0][0] == 0:
        seed_subjects = [
            ("Data Structures & Algorithms", 42, 50, 85.0),
            ("Operating Systems",            30, 40, 85.0),
            ("Machine Learning",             18, 20, 85.0),
        ]
        for name, present, total, target in seed_subjects:
            await db.execute(
                "INSERT INTO subjects (name, present, total, target, original_present, original_total) VALUES (?, ?, ?, ?, ?, ?)",
                (name, present, total, target, present, total),
            )

    row = await db.execute_fetchall("SELECT COUNT(*) as c FROM notes")
    if row[0][0] == 0:
        seed_notes = [
            (
                "Binary Search Trees",
                "A BST is a binary tree where the left child is smaller and the right child is larger than the parent. Traversals: inorder gives sorted output. Insert, delete, search are O(h) where h is height. Balanced BSTs (AVL, Red-Black) guarantee O(log n).",
                "algorithms,data-structures,trees",
            ),
            (
                "Process Scheduling Algorithms",
                "CPU scheduling decides which process runs next. FCFS is simple but has convoy effect. SJF minimises average waiting time but needs burst prediction. Round Robin is fair with time quantum. Priority scheduling can cause starvation — solved by aging.",
                "operating-systems,scheduling",
            ),
            (
                "Linear Regression Fundamentals",
                "Linear regression models the relationship between dependent and independent variables using y = mx + b. Cost function is MSE. Gradient descent iteratively updates weights. R-squared measures goodness of fit. Regularisation (L1/L2) prevents overfitting.",
                "machine-learning,statistics,regression",
            ),
            (
                "Graph Traversal: BFS & DFS",
                "BFS uses a queue and explores level by level — useful for shortest path in unweighted graphs. DFS uses a stack (or recursion) and goes deep first — useful for topological sort, cycle detection, and connected components. Time complexity: O(V+E).",
                "algorithms,graphs,data-structures",
            ),
        ]
        for title, content, tags in seed_notes:
            await db.execute(
                "INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)",
                (title, content, tags),
            )

    row = await db.execute_fetchall("SELECT COUNT(*) as c FROM notices")
    if row[0][0] == 0:
        seed_notices = [
            (
                "Mid-Semester Exam Schedule Released",
                "The mid-semester examination schedule has been posted on the department notice board. Exams start from June 10th. Please collect your hall tickets from the office by June 5th. Carry your college ID card to every exam.",
                "Academic Office",
            ),
            (
                "Hackathon Registration Open",
                "CodeStorm 2026 is here! A 24-hour hackathon open to all years. Teams of 3-4 members. Themes: AI for Education, Sustainable Tech, FinTech. Register at the CS department by May 30th. Prizes worth ₹50,000!",
                "CS Department",
            ),
        ]
        for title, body, author in seed_notices:
            await db.execute(
                "INSERT INTO notices (title, body, author) VALUES (?, ?, ?)",
                (title, body, author),
            )

    row = await db.execute_fetchall("SELECT COUNT(*) as c FROM timetable")
    if row[0][0] == 0:
        # Assuming subjects 1=DS&A, 2=OS, 3=ML based on seed order above
        seed_timetable = [
            (1, "Monday", "09:00", "10:30"),
            (2, "Monday", "11:00", "12:30"),
            (1, "Wednesday", "09:00", "10:30"),
            (3, "Wednesday", "14:00", "15:30"),
            (2, "Friday", "11:00", "12:30"),
            (3, "Friday", "14:00", "15:30"),
        ]
        for subj_id, day, st, et in seed_timetable:
            await db.execute(
                "INSERT INTO timetable (subject_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                (subj_id, day, st, et),
            )

    await db.commit()
    await db.close()
