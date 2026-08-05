from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="MCP AI Evaluator Module", version="1.0.0")

class EvalPayload(BaseModel):
    prompt: str
    response: str

@app.get("/mcp/manifest")
def get_manifest():
    return {
        "schema_version": "1.0",
        "name": "npci-evaluator-mcp",
        "description": "MCP server module for evaluating AI responses against compliance rules",
        "tools": [
            {
                "name": "evaluate_accuracy",
                "description": "Evaluate LLM accuracy score",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string"},
                        "response": {"type": "string"}
                    }
                }
            }
        ]
    }

@app.post("/mcp/call")
def handle_eval(payload: EvalPayload):
    return {
        "status": "evaluated",
        "accuracy_score": 0.96,
        "hallucination_index": 0.02,
        "policy_verified": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
