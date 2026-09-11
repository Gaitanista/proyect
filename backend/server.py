"""
ErgoStudy — Backend (FastAPI + SQLite)

API contract consumed by the React frontend:

  POST   /api/auth/register   {name, email, password}      -> {user}
  POST   /api/auth/login      {email, password}            -> {user}
  GET    /api/auth/me                                       -> user | 401
  POST   /api/auth/logout                                   -> {ok: true}
  PUT    /api/profile         {estatura, tipo_escritorio, …} -> user
  GET    /api/sessions                                      -> [session]
  POST   /api/sessions        {duracion_min, foco_min, …}    -> session
  DELETE /api/sessions                                      -> {ok: true}
  GET    /api/stats                                         -> stats

Session cookies (httponly) are used for auth, so the frontend must send
requests with `withCredentials: true` (it already does).

Run:  uvicorn server:app --reload --port 8001
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "ergostudy.db"))
COOKIE_NAME = "ergo_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "lax")  # "none" for cross-site
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

DEMO_EMAIL = "demo@ergostudy.app"
DEMO_PASSWORD = "Ergo#2026"
DEMO_NAME = "Estudiante Demo"

ZONAS = ["cuello", "espalda", "munecas", "ojos", "fatiga"]

ZONA_LABELS = {
    "cuello": "Cuello",
    "espalda": "Espalda",
    "munecas": "Muñecas",
    "ojos": "Ojos",
    "fatiga": "Fatiga",
}

DEFAULT_PROFILE = {
    "estatura": None,
    "tipo_escritorio": None,
    "lateralidad": "diestro",
    "foco_min": 25,
    "pausa_min": 5,
    "meta_diaria_min": 60,
    "recordatorio_ojos": True,
    "recordatorio_postura": True,
    "recordatorio_movimiento": True,
}

AVISO = (
    "ErgoStudy es una herramienta preventiva y educativa. No diagnostica ni "
    "sustituye la valoración de un profesional de la salud."
)

# --------------------------------------------------------------------------- #
# DB helpers
# --------------------------------------------------------------------------- #


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db():
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt          TEXT NOT NULL,
                profile       TEXT NOT NULL DEFAULT '{}',
                created_at    TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tokens (
                token      TEXT PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                fecha              TEXT NOT NULL,
                duracion_min       INTEGER NOT NULL,
                foco_min           INTEGER NOT NULL,
                pausa_min          INTEGER NOT NULL,
                pausas_realizadas  INTEGER NOT NULL DEFAULT 0,
                pre                TEXT NOT NULL DEFAULT '{}',
                post               TEXT NOT NULL DEFAULT '{}',
                notas              TEXT NOT NULL DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user_fecha
                ON sessions(user_id, fecha DESC);
            """
        )


# --------------------------------------------------------------------------- #
# Password hashing (stdlib pbkdf2 — no extra dependencies)
# --------------------------------------------------------------------------- #


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return digest.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate, _ = hash_password(password, salt)
    return secrets.compare_digest(candidate, password_hash)


# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    estatura: Optional[float] = None
    tipo_escritorio: Optional[str] = None
    lateralidad: Optional[str] = None
    foco_min: Optional[int] = None
    pausa_min: Optional[int] = None
    meta_diaria_min: Optional[int] = None
    recordatorio_ojos: Optional[bool] = None
    recordatorio_postura: Optional[bool] = None
    recordatorio_movimiento: Optional[bool] = None


class SessionIn(BaseModel):
    duracion_min: int = Field(ge=1)
    foco_min: int = Field(default=25, ge=1)
    pausa_min: int = Field(default=5, ge=1)
    pausas_realizadas: int = Field(default=0, ge=0)
    pre: Dict[str, int] = Field(default_factory=dict)
    post: Dict[str, int] = Field(default_factory=dict)
    notas: str = ""


# --------------------------------------------------------------------------- #
# App
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_demo_user()
    yield


app = FastAPI(title="ErgoStudy API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Serialization helpers
# --------------------------------------------------------------------------- #


def serialize_user(row: sqlite3.Row) -> Dict[str, Any]:
    profile = json.loads(row["profile"] or "{}")
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "profile": {**DEFAULT_PROFILE, **profile},
    }


def serialize_session(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "fecha": row["fecha"],
        "duracion_min": row["duracion_min"],
        "foco_min": row["foco_min"],
        "pausa_min": row["pausa_min"],
        "pausas_realizadas": row["pausas_realizadas"],
        "pre": json.loads(row["pre"] or "{}"),
        "post": json.loads(row["post"] or "{}"),
        "notas": row["notas"],
    }


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path="/",
    )


def current_user(ergo_token: Optional[str] = Cookie(default=None)) -> Dict[str, Any]:
    if not ergo_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    with db() as conn:
        row = conn.execute(
            """
            SELECT u.* FROM users u
            JOIN tokens t ON t.user_id = u.id
            WHERE t.token = ?
            """,
            (ergo_token,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida")
    return serialize_user(row)


def create_token(conn: sqlite3.Connection, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, datetime.now(timezone.utc).isoformat()),
    )
    return token


# --------------------------------------------------------------------------- #
# Demo data
# --------------------------------------------------------------------------- #


def seed_demo_sessions(conn: sqlite3.Connection, user_id: int) -> None:
    """Preloads a couple of weeks of realistic sessions for the demo account."""
    import random

    random.seed(7)
    today = date.today()
    rows: List[tuple] = []

    for days_ago in range(20, -1, -1):
        # Skip a few days so the streak/weekly chart looks natural
        if days_ago in (17, 12, 6, 2):
            continue
        day = today - timedelta(days=days_ago)
        n_sessions = random.choice([1, 1, 2, 2, 3])
        improvement = (20 - days_ago) / 20.0  # 0 → 1 as we get closer to today

        for _ in range(n_sessions):
            duracion = random.choice([25, 25, 50, 45, 60, 30])
            pausas = max(1, duracion // 25)
            pre = {z: random.randint(1, 5) for z in ZONAS}
            # Molestias altas al principio y más bajas en las sesiones recientes
            post = {
                z: max(0, round(pre[z] + random.uniform(-0.5, 3.0) * (1 - 0.6 * improvement)))
                for z in ZONAS
            }
            fecha = datetime(
                day.year, day.month, day.day, random.randint(15, 21), random.randint(0, 59)
            )
            rows.append(
                (
                    user_id,
                    fecha.isoformat(),
                    duracion,
                    25,
                    5,
                    pausas,
                    json.dumps(pre),
                    json.dumps(post),
                    random.choice(["", "", "Buena concentración", "Me dolió el cuello al final"]),
                )
            )

    conn.executemany(
        """
        INSERT INTO sessions
            (user_id, fecha, duracion_min, foco_min, pausa_min, pausas_realizadas, pre, post, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def ensure_demo_user() -> None:
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (DEMO_EMAIL,)).fetchone()
        if row:
            return
        password_hash, salt = hash_password(DEMO_PASSWORD)
        cur = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, salt, profile, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                DEMO_NAME,
                DEMO_EMAIL,
                password_hash,
                salt,
                json.dumps(
                    {
                        **DEFAULT_PROFILE,
                        "estatura": 172,
                        "tipo_escritorio": "fijo",
                        "lateralidad": "diestro",
                        "meta_diaria_min": 90,
                    }
                ),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        seed_demo_sessions(conn, cur.lastrowid)


# --------------------------------------------------------------------------- #
# Auth routes
# --------------------------------------------------------------------------- #


@app.post("/api/auth/register")
def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    with db() as conn:
        exists = conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Ese correo ya está registrado")

        password_hash, salt = hash_password(payload.password)
        cur = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, salt, profile, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                email,
                password_hash,
                salt,
                json.dumps(DEFAULT_PROFILE),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        user_id = cur.lastrowid
        # New accounts get demo sessions so the dashboard is not empty
        seed_demo_sessions(conn, user_id)
        token = create_token(conn, user_id)
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    set_auth_cookie(response, token)
    return {"user": serialize_user(row)}


@app.post("/api/auth/login")
def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not verify_password(payload.password, row["password_hash"], row["salt"]):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        token = create_token(conn, row["id"])

    set_auth_cookie(response, token)
    return {"user": serialize_user(row)}


@app.get("/api/auth/me")
def me(user: Dict[str, Any] = Depends(current_user)):
    return user


@app.post("/api/auth/logout")
def logout(response: Response, ergo_token: Optional[str] = Cookie(default=None)):
    if ergo_token:
        with db() as conn:
            conn.execute("DELETE FROM tokens WHERE token = ?", (ergo_token,))
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Profile
# --------------------------------------------------------------------------- #


@app.put("/api/profile")
def update_profile(payload: ProfileIn, user: Dict[str, Any] = Depends(current_user)):
    profile = {**DEFAULT_PROFILE, **user["profile"]}
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            profile[key] = value

    # Basic sanity clamps
    profile["foco_min"] = max(5, min(180, int(profile.get("foco_min") or 25)))
    profile["pausa_min"] = max(1, min(60, int(profile.get("pausa_min") or 5)))
    profile["meta_diaria_min"] = max(5, min(720, int(profile.get("meta_diaria_min") or 60)))

    with db() as conn:
        conn.execute("UPDATE users SET profile = ? WHERE id = ?", (json.dumps(profile), user["id"]))
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()

    return serialize_user(row)


# --------------------------------------------------------------------------- #
# Sessions
# --------------------------------------------------------------------------- #


@app.get("/api/sessions")
def list_sessions(user: Dict[str, Any] = Depends(current_user)):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM sessions WHERE user_id = ? ORDER BY fecha DESC, id DESC",
            (user["id"],),
        ).fetchall()
    return [serialize_session(r) for r in rows]


@app.post("/api/sessions")
def create_session(payload: SessionIn, user: Dict[str, Any] = Depends(current_user)):
    with db() as conn:
        cur = conn.execute(
            """
            INSERT INTO sessions
                (user_id, fecha, duracion_min, foco_min, pausa_min, pausas_realizadas, pre, post, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                datetime.now(timezone.utc).isoformat(),
                payload.duracion_min,
                payload.foco_min,
                payload.pausa_min,
                payload.pausas_realizadas,
                json.dumps(payload.pre),
                json.dumps(payload.post),
                payload.notas or "",
            ),
        )
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (cur.lastrowid,)).fetchone()
    return serialize_session(row)


@app.delete("/api/sessions")
def delete_sessions(user: Dict[str, Any] = Depends(current_user)):
    with db() as conn:
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Stats
# --------------------------------------------------------------------------- #

RECOMMENDATIONS = {
    "cuello": {
        "titulo": "Alivia el cuello",
        "consejos": [
            "Sube la pantalla hasta la altura de los ojos para no bajar la cabeza.",
            "Cada 30 min lleva la barbilla al pecho y gira el cuello suavemente.",
            "Relaja los hombros: no los subas hacia las orejas.",
        ],
    },
    "espalda": {
        "titulo": "Cuida tu espalda",
        "consejos": [
            "Apoya toda la zona lumbar en el respaldo y pega los glúteos al asiento.",
            "Ajusta la silla para que las caderas queden al nivel de las rodillas.",
            "Levántate 1 min por cada 30 min de estudio.",
        ],
    },
    "munecas": {
        "titulo": "Protege tus muñecas",
        "consejos": [
            "Codos a ~90° y muñecas rectas, sin doblarlas hacia arriba.",
            "Usa el teclado independiente para no estirar los brazos.",
            "Estira dedos y muñecas cada hora durante 30 segundos.",
        ],
    },
    "ojos": {
        "titulo": "Descansa la vista",
        "consejos": [
            "Aplica la regla 20-20-20: cada 20 min mira 20 s a 6 m de distancia.",
            "Sube el brillo de la pantalla y evita reflejos directos.",
            "Parpadea de forma consciente mientras lees en pantalla.",
        ],
    },
    "fatiga": {
        "titulo": "Recupera energía",
        "consejos": [
            "Hidrátate y haz pausas activas de 5 min entre bloques de foco.",
            "Duerme 7-8 h: la fatiga acumulada empeora la postura.",
            "Alterna materias para no mantener la misma posición mucho tiempo.",
        ],
    },
}


def _avg(values: List[float]) -> float:
    return round(sum(values) / len(values), 1) if values else 0.0


def _streak(days: set[date], today: date) -> int:
    if not days:
        return 0
    cursor = today if today in days else today - timedelta(days=1)
    if cursor not in days:
        return 0
    count = 0
    while cursor in days:
        count += 1
        cursor -= timedelta(days=1)
    return count


@app.get("/api/stats")
def stats(user: Dict[str, Any] = Depends(current_user)):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM sessions WHERE user_id = ? ORDER BY fecha ASC, id ASC",
            (user["id"],),
        ).fetchall()

    sessions = [serialize_session(r) for r in rows]
    today = date.today()

    total_minutos = sum(s["duracion_min"] for s in sessions)
    total_pausas = sum(s["pausas_realizadas"] for s in sessions)

    pre_avg = {z: _avg([s["pre"].get(z, 0) for s in sessions if z in s["pre"]]) for z in ZONAS}
    post_avg = {z: _avg([s["post"].get(z, 0) for s in sessions if z in s["post"]]) for z in ZONAS}

    # --- Weekly bars (last 7 days, oldest → today) ---
    day_names = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    semanal = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        minutos = sum(
            s["duracion_min"] for s in sessions if s["fecha"][:10] == day.isoformat()
        )
        semanal.append({"dia": day_names[day.weekday()], "minutos": minutos})

    # --- Before / after comparison (first third vs last third) ---
    comparativa = []
    if sessions:
        third = max(1, len(sessions) // 3)
        primeros, recientes = sessions[:third], sessions[-third:]
        for z in ZONAS:
            antes = _avg([s["post"].get(z, 0) for s in primeros if z in s["post"]])
            ahora = _avg([s["post"].get(z, 0) for s in recientes if z in s["post"]])
            comparativa.append(
                {
                    "zona": ZONA_LABELS[z],
                    "antes": antes,
                    "recientes": ahora,
                    "delta": round(antes - ahora, 1),
                }
            )

    # --- Recommendations for zones averaging >= 4 (post) ---
    recomendaciones = []
    for z in ZONAS:
        promedio = post_avg.get(z, 0)
        if promedio >= 4:
            recomendaciones.append(
                {
                    "zona": z,
                    "titulo": RECOMMENDATIONS[z]["titulo"],
                    "promedio": promedio,
                    "consejos": RECOMMENDATIONS[z]["consejos"],
                }
            )
    recomendaciones.sort(key=lambda r: r["promedio"], reverse=True)

    # --- Streak / daily goal ---
    study_days = {date.fromisoformat(s["fecha"][:10]) for s in sessions}
    minutos_hoy = sum(s["duracion_min"] for s in sessions if s["fecha"][:10] == today.isoformat())
    meta = int(user["profile"].get("meta_diaria_min") or 60)
    week_start = today - timedelta(days=today.weekday())
    sesiones_semana = sum(1 for s in sessions if date.fromisoformat(s["fecha"][:10]) >= week_start)

    return {
        "resumen": {
            "total_minutos": total_minutos,
            "total_sesiones": len(sessions),
            "total_pausas": total_pausas,
            "fatiga_pre_prom": pre_avg.get("fatiga", 0),
            "fatiga_post_prom": post_avg.get("fatiga", 0),
        },
        "semanal": semanal,
        "promedios_molestias": post_avg,
        "promedios_iniciales": pre_avg,
        "comparativa": comparativa,
        "recomendaciones": recomendaciones,
        "racha": {
            "dias": _streak(study_days, today),
            "minutos_hoy": minutos_hoy,
            "meta_diaria_min": meta,
            "meta_cumplida": minutos_hoy >= meta,
            "sesiones_semana": sesiones_semana,
        },
        "aviso": AVISO,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"name": "ErgoStudy API", "docs": "/docs", "frontend": FRONTEND_URL}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8001)), reload=True)
