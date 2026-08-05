from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="MCP Cost Tracker Module", version="1.0.0")

class TokenMetrics(BaseModel):
    model: str
    tokens_used: int

@app.get("/mcp/manifest")
def get_manifest():
    return {
        "schema_version": "1.0",
        "name": "npci-cost-tracker-mcp",
        "description": "MCP server module for monitoring token usage and cloud operational costs",
        "tools": [
            {
                "name": "calculate_cost",
                "description": "Calculate cost based on token counts",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "model": {"type": "string"},
                        "tokens_used": {"type": "integer"}
                    }
                }
            }
        ]
    }

@app.post("/mcp/call")
def handle_cost(metrics: TokenMetrics):
    rate = 0.0000005
    calculated_usd = metrics.tokens_used * rate
    return {
        "model": metrics.model,
        "tokens_used": metrics.tokens_used,
        "estimated_cost_usd": round(calculated_usd, 6),
        "currency": "USD"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
