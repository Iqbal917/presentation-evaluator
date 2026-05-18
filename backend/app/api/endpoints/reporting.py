from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
import os
from app.core.security import get_current_user_optional, get_user_identifier
from app.services import evaluate_module

router = APIRouter(tags=["Reporting & Analytics"])

@router.get("/api/report")
async def api_report(request: Request):
    """Get user-specific report"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Get user-specific report
        user_report_path = f"user_data/{user_identifier}/report.txt"
        if not os.path.exists(user_report_path):
            raise HTTPException(status_code=404, detail={"error": "No report available"})
        
        data = evaluate_module.get_user_report_data(user_identifier)
        if (data["confidence_score"] == 0 and 
            not data["video_analysis"] and 
            data["transcribed_text"] == "No transcript available"):
            raise HTTPException(status_code=404, detail={"error": "No report available"})
            
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-report")
async def download_report(request: Request):
    """Download user-specific report"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        user_report_path = f"user_data/{user_identifier}/report.txt"
        if os.path.exists(user_report_path):
            return FileResponse(
                path=user_report_path,
                filename='presentation_report.txt',
                media_type='text/plain'
            )
        raise HTTPException(status_code=404, detail="Report not found. Please run an evaluation first.")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report")
async def report():
    return RedirectResponse(url="http://localhost:5173/report", status_code=302)
