# python-service/core/gemini_integrator.py
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_resume_insights_from_gemini(resume_text: str, jd_text: str):
    # Change 'gemini-pro' to 'gemini-flash'
    model = genai.GenerativeModel('gemini-flash')
    prompt = f"""
    Given the following resume text and job description, provide constructive feedback for the resume.
    Focus on what to add, what to remove, and how to rephrase sections to better align with the job description.
    Provide actionable advice.

    Resume:
    {resume_text}

    Job Description:
    {jd_text}
    """
    response = model.generate_content(prompt)
    return response.text

def chat_with_gemini(history: list, new_message: str):
    # Change 'gemini-pro' to 'gemini-flash'
    model = genai.GenerativeModel('gemini-flash')
    chat = model.start_chat(history=history)
    response = chat.send_message(new_message)
    return response.text