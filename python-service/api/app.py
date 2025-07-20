from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="VerdeHire Python AI Service",
    description="AI-powered backend for resume and job description analysis.",
    version="1.0.0"
)

# Simple health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Python AI service is running!"}

# Example endpoint for future resume processing
@app.post("/analyze_resume")
async def analyze_resume_endpoint(resume_file: UploadFile = File(...), job_description: str = ""):
    if not resume_file.filename.endswith(('.pdf', '.doc', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, DOC, TXT are allowed.")

    # In a real scenario, you'd save the file temporarily or stream it
    # and then pass to your core logic (resume_parser, jd_analyzer, gemini_integrator)
    # For now, just confirming receipt
    print(f"Received resume: {resume_file.filename}")
    print(f"Received job description: {job_description[:50]}...") # Print first 50 chars

    # Here you would call your core AI/ML functions
    # For example:
    # from core.resume_parser import parse_resume
    # from core.jd_analyzer import analyze_jd
    # parsed_data = parse_resume(await resume_file.read(), resume_file.filename)
    # jd_insights = analyze_jd(job_description)
    # insights = combine_with_gemini_api(parsed_data, jd_insights)

    return JSONResponse(
        content={
            "message": "Resume and Job Description received successfully (processing not yet implemented)",
            "filename": resume_file.filename,
            "job_description_length": len(job_description)
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("UVICORN_PORT", 5001)) # Default to 5001 if not set in .env
    uvicorn.run(app, host="0.0.0.0", port=port)