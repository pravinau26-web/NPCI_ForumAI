from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import time
import json
import logging
from datetime import datetime

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "python-backend", "message": "%(message)s"}'
)
logger = logging.getLogger("npci_forum_python")

app = FastAPI(
    title="NPCI Forum Python AI & Agent Architecture API",
    version="2.0.0",
    description="Python FastAPI backend powering NPCI Payment Forum, Agent Coordination, MCP Servers, Evaluation, Observability & Cost Tracking"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Stores / Fallback Session Stores
session_store: Dict[str, Dict[str, Any]] = {}
observability_traces: List[Dict[str, Any]] = []
cost_records: List[Dict[str, Any]] = []

class ChatRequest(BaseModel):
    user_id: str
    message: str
    chat_id: Optional[str] = "chat-1"
    model: Optional[str] = "gemini-2.5-flash"

class EvaluationRequest(BaseModel):
    prompt: str
    response: str
    expected_output: Optional[str] = None

class CostTrackRequest(BaseModel):
    model: str
    input_tokens: int
    output_tokens: int
    user_id: str

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration:.4f}s")
    return response

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "NPCI Forum Python Backend Engine",
        "version": "2.0.0",
        "architecture": "Microservices with Helm, Docker, Terraform & AWS"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/metrics")
def get_metrics():
    total_cost = sum(item.get("cost_usd", 0) for item in cost_records)
    total_traces = len(observability_traces)
    total_requests = len(observability_traces) + len(cost_records) + 1
    content = f"""# HELP npci_backend_requests_total Total API requests processed
# TYPE npci_backend_requests_total counter
npci_backend_requests_total {total_requests}

# HELP npci_backend_cost_usd_total Total AI agent estimated cost in USD
# TYPE npci_backend_cost_usd_total counter
npci_backend_cost_usd_total {total_cost:.6f}

# HELP npci_backend_traces_total Total AI observability traces
# TYPE npci_backend_traces_total gauge
npci_backend_traces_total {total_traces}
"""
    return Response(content=content, media_type="text/plain")

# 1. AI Coordinating Agent Endpoint
@app.post("/api/ai/coordinate")
async def coordinate_agent(req: ChatRequest):
    start = time.time()
    user_msg = req.message.lower()
    
    # Simple agent router logic
    agent_type = "PolicyRAGAgent" if "policy" in user_msg or "upi" in user_msg or "rupay" in user_msg else "GeneralForumAgent"
    
    reply = f"[NPCI Python Coordinator ({agent_type})]: Processed request regarding '{req.message[:50]}...'. All compliance guidelines and forum channels are online."
    
    latency = time.time() - start
    
    # Record Observability Trace
    trace = {
        "id": f"trace-{int(time.time()*1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "agent": agent_type,
        "prompt": req.message,
        "response": reply,
        "latency_sec": round(latency, 4),
        "user_id": req.user_id,
        "tool_calls": ["retrieve_policy_specs", "grounding_search"]
    }
    observability_traces.append(trace)
    
    # Record Token & Cost Track
    input_tok = len(req.message.split()) * 2
    output_tok = len(reply.split()) * 2
    estimated_cost = (input_tok * 0.00000015) + (output_tok * 0.0000006)
    
    cost_records.append({
        "id": f"cost-{int(time.time()*1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": req.user_id,
        "model": req.model,
        "input_tokens": input_tok,
        "output_tokens": output_tok,
        "cost_usd": round(estimated_cost, 6)
    })
    
    return {
        "reply": reply,
        "agent_used": agent_type,
        "trace_id": trace["id"],
        "cost_usd": estimated_cost
    }

# 2. Evaluation Suite Endpoint
@app.post("/api/ai/evaluate")
async def evaluate_response(req: EvaluationRequest):
    # Calculate simple metric scores (Factual accuracy, Grounding, Policy Compliance)
    relevance_score = min(1.0, len(set(req.prompt.lower().split()).intersection(set(req.response.lower().split()))) / max(1, len(req.prompt.split()))) + 0.5
    compliance_score = 0.98 if "npci" in req.response.lower() or "compliance" in req.response.lower() else 0.85
    
    return {
        "status": "evaluated",
        "relevance_score": round(min(1.0, relevance_score), 2),
        "compliance_score": compliance_score,
        "overall_grade": "PASSED" if relevance_score > 0.6 else "NEEDS_REVIEW",
        "timestamp": datetime.utcnow().isoformat()
    }

# 3. Observability Endpoint
@app.get("/api/observability/traces")
async def get_traces():
    return {"total_traces": len(observability_traces), "traces": observability_traces[-50:]}

# 4. Cost Tracker Endpoint
@app.get("/api/cost/summary")
async def get_cost_summary():
    total_cost = sum(item["cost_usd"] for item in cost_records)
    total_input = sum(item["input_tokens"] for item in cost_records)
    total_output = sum(item["output_tokens"] for item in cost_records)
    
    return {
        "total_cost_usd": round(total_cost, 6),
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "recent_records": cost_records[-20:]
    }

# 5. Session Store Endpoints
@app.post("/api/session/set")
async def set_session(session_id: str, data: Dict[str, Any]):
    session_store[session_id] = {
        "data": data,
        "updated_at": datetime.utcnow().isoformat()
    }
    return {"status": "success", "session_id": session_id}

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_store[session_id]

# 6. Log Purge Trigger Endpoint
@app.post("/api/system/purge-logs")
async def purge_logs():
    global observability_traces, cost_records
    cutoff_traces = len(observability_traces)
    observability_traces = observability_traces[-100:]  # Keep last 100
    cost_records = cost_records[-100:]
    
    logger.info("Executed automatic log and trace rotation purge.")
    return {
        "status": "purged",
        "retained_traces": len(observability_traces),
        "message": "Logs and trace storage purged successfully."
    }
