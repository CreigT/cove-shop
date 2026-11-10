"""Reservation engine: SQLite-backed, parameterized queries, no external dependencies."""
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).with_name("reservations.db")

def connect(path=DB_PATH):
    db = sqlite3.connect(path, timeout=10)
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=10000")
    db.execute("""CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY, seats INTEGER NOT NULL CHECK(seats > 0))""")
    db.execute("""CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL REFERENCES tables(id),
        guest TEXT NOT NULL, party INTEGER NOT NULL CHECK(party > 0),
        starts_at TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(table_id, starts_at))""")
    db.commit()
    return db

def seed(db):
    db.executemany("INSERT OR IGNORE INTO tables(id,seats) VALUES (?,?)",
                   [(1,2),(2,2),(3,4),(4,4),(5,6),(6,8)])
    db.commit()

def book(db, guest, party, starts_at):
    if not isinstance(guest,str) or not 1 <= len(guest.strip()) <= 80:
        raise ValueError("Guest name must be 1–80 characters")
    if type(party) is not int or not 1 <= party <= 8:
        raise ValueError("Party size must be between 1 and 8")
    try:
        dt = datetime.fromisoformat(starts_at)
        if dt.tzinfo is not None or dt.minute % 30 or dt.second or dt.microsecond:
            raise ValueError()
        if dt <= datetime.now():
            raise ValueError()
    except (TypeError, ValueError):
        raise ValueError("Use a future local date/time in YYYY-MM-DDTHH:MM, on a half-hour")
    # Exclusive transaction serializes competing requests to the same SQLite file.
    db.execute("BEGIN IMMEDIATE")
    try:
        row = db.execute("""SELECT t.id FROM tables t
            WHERE t.seats >= ? AND NOT EXISTS (
                SELECT 1 FROM bookings b WHERE b.table_id=t.id
                AND b.starts_at > datetime(?, '-90 minutes')
                AND b.starts_at < datetime(?, '+90 minutes'))
            ORDER BY t.seats, t.id LIMIT 1""", (party,starts_at,starts_at)).fetchone()
        if row is None:
            db.rollback()
            return {"status":"unavailable"}
        cur = db.execute("INSERT INTO bookings(table_id,guest,party,starts_at,created_at) VALUES (?,?,?,?,?)",
                         (row[0],guest.strip(),party,starts_at,datetime.now().isoformat()))
        db.commit()
        return {"status":"confirmed","booking_id":cur.lastrowid,"table_id":row[0]}
    except Exception:
        db.rollback()
        raise

def decide(payload):
    action = payload.get("action","normal")
    if action == "interrupt":
        return {"status":"interrupted","message":"Stopped. Tell me your updated request."}
    if action == "handoff":
        return {"status":"handoff_requested","message":"Please contact restaurant staff. No transfer has been initiated."}
    if action != "normal":
        raise ValueError("Unknown action")
    return None
