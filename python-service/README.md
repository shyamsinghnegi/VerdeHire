# VerdeHire Python AI Service

This service provides AI-powered functionalities for resume parsing, job description analysis, and intelligent matching using FastAPI and Google Gemini API.

## Setup

1.  Navigate into this directory:
    ```bash
    cd VerdeHire/python-service
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # macOS/Linux
    .\venv\Scripts\activate.bat # Windows Command Prompt
    .\venv\Scripts\Activate.ps1 # Windows PowerShell
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    (If `requirements.txt` is not yet created, run `pip install fastapi uvicorn python-dotenv python-multipart pypdf2 python-docx spacy google-generativeai` and then `pip freeze > requirements.txt`)
4.  Download SpaCy English model:
    ```bash
    python -m spacy download en_core_web_sm
    ```
5.  Create a `.env` file in this directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    UVICORN_PORT=5001
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.

## Running the Service

Make sure your virtual environment is activated.

```bash
uvicorn api.app:app --reload --host 0.0.0.0 --port 5001