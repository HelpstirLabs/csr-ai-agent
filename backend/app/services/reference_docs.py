from pathlib import Path
from docx import Document

REFERENCE_DIR = Path("reference_docs")


def read_docx(file_path: Path) -> str:
    doc = Document(file_path)
    # // Extract text from paragraphs, ignoring empty ones

    paragraphs = [
        p.text.strip()
        for p in doc.paragraphs
        if p.text.strip()
    ]

    return "\n".join(paragraphs)


def load_reference_documents() -> str:
    documents = []

    for file in REFERENCE_DIR.glob("*.docx"):
        try:
            documents.append(read_docx(file))
        except Exception as e:
            print(f"Error reading {file}: {e}")

    return "\n\n".join(documents)


REFERENCE_CONTENT = load_reference_documents()