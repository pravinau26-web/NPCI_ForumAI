from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="MCP Forum Server Module", version="1.0.0")

class MCPToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

@app.get("/mcp/manifest")
def get_manifest():
    return {
        "schema_version": "1.0",
        "name": "npci-forum-mcp",
        "description": "Model Context Protocol (MCP) server providing access to NPCI Forum topics and policy guidelines",
        "tools": [
            {
                "name": "search_policies",
                "description": "Search NPCI compliance guidelines and policy manuals",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search keyword for policy documents"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "list_channels",
                "description": "Retrieve active discussion channels in the NPCI forum",
                "parameters": {"type": "object", "properties": {}}
            }
        ]
    }

@app.post("/mcp/call")
def handle_tool_call(call: MCPToolCall):
    if call.name == "search_policies":
        query = call.arguments.get("query", "")
        return {
            "result": [
                {
                    "policy_id": "pol-101",
                    "title": "UPI 2.0 Auto recurring mandates compliance",
                    "match": f"Guideline matching query: '{query}'"
                }
            ]
        }
    elif call.name == "list_channels":
        return {
            "channels": ["NPCI Technical Specs", "UPI 2.0 Integration", "RuPay Contactless", "Dispute Resolution Engine"]
        }
    return {"error": "Tool not recognized"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
