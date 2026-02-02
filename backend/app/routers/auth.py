import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt

from app.database import get_db
from app.models.db_models import User, PasswordResetToken

router = APIRouter()

# Marcador para usuarios solo Google (no usan contraseña)
GOOGLE_MARKER = "GOOGLE_ONLY"

# Caducidad del token de restablecimiento (horas)
RESET_TOKEN_EXPIRY_HOURS = 24


class CredentialsBody(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None


class RegisterResponse(BaseModel):
    id: int
    email: str
    name: str | None
    email_sent: bool


class InviteResponse(BaseModel):
    id: int
    email: str
    name: str | None
    email_sent: bool


class AddUserBody(BaseModel):
    email: str
    name: str | None = None


class RegisterBody(BaseModel):
    email: str
    password: str | None = None  # ignorado: se genera contraseña aleatoria y se envía por correo
    name: str | None = None


class ForgotPasswordBody(BaseModel):
    email: str


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


@router.post("/verify", response_model=UserResponse)
def verify_credentials(body: CredentialsBody, db: Session = Depends(get_db)):
    """Verifica email y contraseña. Retorna el usuario si es válido."""
    user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if user.password_hash == GOOGLE_MARKER:
        raise HTTPException(status_code=401, detail="Usa inicio con Google")
    try:
        if not bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return UserResponse(id=user.id, email=user.email, name=user.name)


@router.get("/allowed")
def check_allowed(email: str = Query(...), db: Session = Depends(get_db)):
    """Verifica si un email está autorizado (Google OAuth: cualquier dominio si está en la tabla)."""
    email_trim = (email or "").strip().lower()
    if not email_trim:
        return {"allowed": False}
    user = db.query(User).filter(User.email == email_trim).first()
    return {"allowed": user is not None}


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Lista todos los usuarios autorizados."""
    users = db.query(User).order_by(User.email).all()
    return [UserResponse(id=u.id, email=u.email, name=u.name) for u in users]


@router.post("/users", response_model=UserResponse)
def add_user(body: AddUserBody, db: Session = Depends(get_db)):
    """Añade un usuario autorizado para Google OAuth (cualquier email, ej. @doktuz.com o @gmail.com)."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obligatorio")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    name = (body.name or "").strip() or None
    user = User(email=email, password_hash=GOOGLE_MARKER, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, email=user.email, name=user.name)


def _send_invite_email(to_email: str, plain_password: str, login_url: str) -> bool:
    """Envía email con contraseña generada. Resend o SMTP. La contraseña solo va en el email, nunca se guarda en claro."""
    api_key = os.getenv("RESEND_API_KEY")
    from_resend = (os.getenv("RESEND_FROM") or "Cotizador <onboarding@resend.dev>").strip()
    if api_key:
        try:
            import httpx
            r = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_resend,
                    "to": [to_email],
                    "subject": "Tu cuenta en Cotizador - Contraseña de acceso",
                    "html": f'<p>Se ha creado tu cuenta. Tu contraseña temporal es:</p><p><strong>{plain_password}</strong></p><p>Inicia sesión aquí: <a href="{login_url}">{login_url}</a></p><p>Recomendamos cambiar la contraseña desde "Olvidé mi contraseña" después del primer acceso.</p>',
                },
                timeout=10.0,
            )
            if r.status_code != 200:
                import logging
                logging.warning("Resend invite email failed: status=%s body=%s", r.status_code, r.text)
            return r.status_code == 200
        except Exception as e:
            import logging
            logging.warning("Resend invite email error: %s", e)
            return False
    host = os.getenv("SMTP_HOST")
    user_smtp = os.getenv("SMTP_USER")
    password_smtp = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", user_smtp)
    if not host or not user_smtp or not password_smtp:
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        text = f"Se ha creado tu cuenta. Tu contraseña temporal es: {plain_password}\n\nInicia sesión: {login_url}\n\nRecomendamos cambiar la contraseña desde Olvidé mi contraseña después del primer acceso."
        msg = MIMEText(text, "plain")
        msg["Subject"] = "Tu cuenta en Cotizador - Contraseña de acceso"
        msg["From"] = from_email
        msg["To"] = to_email
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587"))) as server:
            server.starttls()
            server.login(user_smtp, password_smtp)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception:
        return False


def _send_welcome_email(to_email: str, name: str | None, login_url: str, plain_password: str | None = None) -> bool:
    """Envía correo de bienvenida al registrarse. Si plain_password se pasa, lo incluye (contraseña aleatoria)."""
    import logging
    api_key = os.getenv("RESEND_API_KEY")
    from_resend = (os.getenv("RESEND_FROM") or "Cotizador <onboarding@resend.dev>").strip()
    saludo = f"Hola, {name}." if name else "Hola."
    if plain_password:
        html_body = (
            f'<p>{saludo}</p>'
            f'<p>Se ha creado tu cuenta. Tu contraseña de acceso es:</p><p><strong>{plain_password}</strong></p>'
            f'<p>Inicia sesión aquí: <a href="{login_url}">{login_url}</a></p>'
            f'<p>Recomendamos cambiar la contraseña desde "Olvidé mi contraseña" después del primer acceso.</p>'
        )
        text_body = f"{saludo}\n\nSe ha creado tu cuenta. Tu contraseña de acceso es: {plain_password}\n\nInicia sesión: {login_url}\n\nRecomendamos cambiar la contraseña desde Olvidé mi contraseña después del primer acceso."
    else:
        html_body = f'<p>{saludo}</p><p>Tu cuenta está lista. Ya puedes iniciar sesión:</p><p><a href="{login_url}">{login_url}</a></p>'
        text_body = f"{saludo}\n\nTu cuenta está lista. Ya puedes iniciar sesión en: {login_url}"
    if api_key:
        try:
            import httpx
            r = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_resend,
                    "to": [to_email],
                    "subject": "Bienvenido a Cotizador",
                    "html": html_body,
                },
                timeout=10.0,
            )
            if r.status_code != 200:
                logging.warning("Resend welcome email failed: status=%s body=%s", r.status_code, r.text)
            return r.status_code == 200
        except Exception as e:
            logging.warning("Resend welcome email error: %s", e)
            return False
    host = os.getenv("SMTP_HOST")
    user_smtp = os.getenv("SMTP_USER")
    password_smtp = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", user_smtp)
    if not host or not user_smtp or not password_smtp:
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        msg = MIMEText(text_body, "plain")
        msg["Subject"] = "Bienvenido a Cotizador"
        msg["From"] = from_email
        msg["To"] = to_email
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587"))) as server:
            server.starttls()
            server.login(user_smtp, password_smtp)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception:
        return False


@router.post("/users/invite", response_model=InviteResponse)
def invite_user(body: AddUserBody, db: Session = Depends(get_db)):
    """Crea un usuario con contraseña aleatoria y la envía por email. La tabla guarda solo el hash (bcrypt)."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obligatorio")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    name = (body.name or "").strip() or None
    plain_password = "".join(str(secrets.randbelow(10)) for _ in range(6))
    password_hash = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, password_hash=password_hash, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    frontend_url = (os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_APP_URL") or "http://localhost:3000").rstrip("/")
    login_url = f"{frontend_url}/login"
    sent = _send_invite_email(email, plain_password, login_url)
    return InviteResponse(id=user.id, email=user.email, name=user.name, email_sent=sent)


@router.post("/register", response_model=RegisterResponse)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """Registro: se genera contraseña aleatoria y se envía por correo junto al enlace de login."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obligatorio")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
    name = (body.name or "").strip() or None
    plain_password = "".join(str(secrets.randbelow(10)) for _ in range(6))
    password_hash = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, password_hash=password_hash, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    frontend_url = (os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_APP_URL") or "http://localhost:3000").rstrip("/")
    login_url = f"{frontend_url}/login"
    email_sent = _send_welcome_email(email, name, login_url, plain_password=plain_password)
    return RegisterResponse(id=user.id, email=user.email, name=user.name, email_sent=email_sent)


def _send_reset_email(to_email: str, reset_link: str) -> bool:
    """Envía email con enlace de restablecimiento. Resend o SMTP. Devuelve True si se envió."""
    import logging
    # 1) Resend (prioridad si está configurado)
    api_key = os.getenv("RESEND_API_KEY")
    from_resend = (os.getenv("RESEND_FROM") or "Cotizador <onboarding@resend.dev>").strip()
    if api_key:
        try:
            import httpx
            r = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_resend,
                    "to": [to_email],
                    "subject": "Restablecer contraseña - Cotizador",
                    "html": f'<p>Restablece tu contraseña haciendo clic en:</p><p><a href="{reset_link}">{reset_link}</a></p><p>El enlace caduca en {RESET_TOKEN_EXPIRY_HOURS} horas.</p>',
                },
                timeout=10.0,
            )
            if r.status_code == 200:
                return True
            logging.warning(
                "Resend reset email failed: status=%s body=%s (RESEND_API_KEY set, check key and RESEND_FROM domain)",
                r.status_code, r.text,
            )
            return False
        except Exception as e:
            logging.warning("Resend reset email error: %s", e)
            return False
    # 2) SMTP (alternativa)
    host = os.getenv("SMTP_HOST")
    user_smtp = os.getenv("SMTP_USER")
    password_smtp = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", user_smtp)
    if not host or not user_smtp or not password_smtp:
        logging.warning(
            "Reset email not sent: no RESEND_API_KEY and no SMTP (SMTP_HOST/SMTP_USER/SMTP_PASSWORD). "
            "Set RESEND_API_KEY and RESEND_FROM in Render (or SMTP_*) for forgot-password emails."
        )
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        port = int(os.getenv("SMTP_PORT", "587"))
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Restablecer contraseña - Cotizador"
        msg["From"] = from_email
        msg["To"] = to_email
        text = f"Restablece tu contraseña en: {reset_link}\n\nEl enlace caduca en {RESET_TOKEN_EXPIRY_HOURS} horas."
        msg.attach(MIMEText(text, "plain"))
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user_smtp, password_smtp)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logging.warning("SMTP reset email error: %s", e)
        return False


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordBody, db: Session = Depends(get_db)):
    """Solicita restablecer contraseña. Siempre devuelve éxito para no revelar si el email existe."""
    import logging
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obligatorio")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logging.info("forgot-password: email not in DB, no email sent (by design): %s", email)
        return {"message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña."}
    # Usuarios con cuenta (email/password o Google) reciben el enlace; los Google-only pueden así fijar contraseña
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)).isoformat() + "Z"
    db.add(PasswordResetToken(email=email, token=token, expires_at=expires_at))
    db.commit()
    frontend_url = (os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_APP_URL") or "http://localhost:3000").rstrip("/")
    reset_link = f"{frontend_url}/restablecer-clave?token={token}"
    sent = _send_reset_email(email, reset_link)
    if not sent:
        logging.warning("forgot-password: _send_reset_email returned False for %s", email)
    return {"message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    """Restablece la contraseña con el token recibido por email."""
    token = (body.token or "").strip()
    new_password = (body.new_password or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token obligatorio")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    row = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not row:
        raise HTTPException(status_code=400, detail="Enlace inválido o caducado")
    try:
        expires = datetime.fromisoformat(row.expires_at.replace("Z", ""))
    except Exception:
        expires = datetime.min
    if datetime.utcnow() > expires:
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=400, detail="Enlace caducado. Solicita uno nuevo.")
    user = db.query(User).filter(User.email == row.email).first()
    if not user or user.password_hash == GOOGLE_MARKER:
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=400, detail="Enlace inválido")
    user.password_hash = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")
    db.delete(row)
    db.commit()
    return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}
