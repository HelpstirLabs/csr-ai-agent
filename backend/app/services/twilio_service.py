from twilio.rest import Client
from app.core.config import settings

client = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN
)

VERIFY_SERVICE_SID = settings.TWILIO_VERIFY_SERVICE_SID


async def send_phone_otp(phone: str):
    print("SEND SID:", VERIFY_SERVICE_SID)

    verification = client.verify.v2.services(
        VERIFY_SERVICE_SID
    ).verifications.create(
        to=phone,
        channel="sms"
    )

    print("Verification SID:", verification.sid)
    return verification


async def verify_phone_otp(phone: str, otp: str):
    try:
        print("VERIFY SID:", VERIFY_SERVICE_SID)
        print("PHONE:", phone)
        print("OTP:", otp)

        verification_check = client.verify.v2.services(
            VERIFY_SERVICE_SID
        ).verification_checks.create(
            to=phone,
            code=otp
        )

        print("Verification SID:", verification_check.sid)
        print("Status:", verification_check.status)

        return verification_check.status == "approved"

    except Exception as e:
        print("TWILIO ERROR")
        print(type(e).__name__)
        print(str(e))
        raise

async def send_verification_success_sms(phone: str):
    message = client.messages.create(
        body="Your account has been verified successfully. Welcome!",
        from_=settings.TWILIO_PHONE_NUMBER,
        to=phone
    )

    return message.sid