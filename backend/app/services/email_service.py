import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def get_smtp_connection():
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))

    if smtp_port == 465:
        return smtplib.SMTP_SSL(
            smtp_host,
            smtp_port,
            timeout=30,
        )

    server = smtplib.SMTP(
        smtp_host,
        smtp_port,
        timeout=30,
    )

    server.starttls()

    return server


async def send_test_email(
    to_email: str,
    ngo_id: str,
):
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv(
        "SMTP_FROM_EMAIL",
        smtp_username,
    )

    subject = "RFP Request from Helpstir"

    body = """
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

    with get_smtp_connection() as server:

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
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv(
        "SMTP_FROM_EMAIL",
        smtp_username,
    )

    message = MIMEMultipart()

    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    with get_smtp_connection() as server:

        server.login(
            smtp_username,
            smtp_password,
        )

        server.sendmail(
            from_email,
            to_email,
            message.as_string(),
        )