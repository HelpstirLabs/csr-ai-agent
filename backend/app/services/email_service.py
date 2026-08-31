import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


async def send_test_email(
    to_email: str,
    ngo_id: str,
):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(
        os.getenv("SMTP_PORT", "587")
    )
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv(
        "SMTP_FROM_EMAIL",
        smtp_username,
    )

    subject = "RFP Request from Helpstir"
    body = f"""
Hello,

You have received a new RFP request from a CSR Funder through Helpstir.

Please log in to your Helpstir account to view the RFP details and take the necessary action.

Please review the request at your earliest convenience.

Regards,
Helpstir Team
"""

    message = MIMEMultipart()

    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    with smtplib.SMTP(
        smtp_host,
        smtp_port,
    ) as server:

        server.starttls()

        server.login(
            smtp_username,
            smtp_password,
        )

        server.sendmail(
            from_email,
            to_email,
            message.as_string(),
        )


async def send_email(
    to_email: str,
    subject: str,
    body: str,
):
    sender_email = os.getenv("SMTP_USERNAME")
    sender_password = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(
        os.getenv("SMTP_PORT", "587")
    )
    from_email = os.getenv(
            "SMTP_FROM_EMAIL",
            sender_email,
        )

    message = MIMEMultipart()

    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    with smtplib.SMTP(
        smtp_host,
        smtp_port
    ) as server:

        server.starttls()

        server.login(
            sender_email,
            sender_password
        )

        server.sendmail(
            sender_email,
            to_email,
            message.as_string()
        )