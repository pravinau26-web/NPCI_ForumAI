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
                "name": "query_vector_db",
                "description": "Search vector DB embeddings for grounded RAG context on complaints, specs, and policies",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Query text to search vector embeddings"},
                        "top_k": {"type": "integer", "description": "Number of top matches"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "read_postgres_data",
                "description": "Retrieve persisted forum topics, user complaints, technical hierarchy, and chat messages from PostgreSQL DB",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table": {"type": "string", "description": "Table name (discussions, complaints, chats, hierarchy)"}
                    },
                    "required": ["table"]
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
    elif call.name == "query_vector_db":
        query = call.arguments.get("query", "")
        top_k = call.arguments.get("top_k", 3)
        return {
            "source": "VectorDB (EBS Persistence)",
            "query": query,
            "embeddings_matched": top_k,
            "results": [
                {
                    "chunk_id": "vec-chunk-01",
                    "document": "NPCI UPI 2.0 Compliance Guide v2.1",
                    "content": f"Vector match for '{query}': UPI 2.0 transaction limit guidelines set at ₹5 Lakh for Healthcare & Education categories.",
                    "score": 0.94
                },
                {
                    "chunk_id": "vec-chunk-02",
                    "document": "RuPay Contactless Tokenization Protocol v4.0",
                    "content": "EMV offline tokenization rules require RSA-2048 encryption for key storage.",
                    "score": 0.88
                }
            ]
        }
    elif call.name == "read_postgres_data":
        table = call.arguments.get("table", "discussions")
        return {
            "database": "PostgreSQL (EBS Volume /data/db/postgres)",
            "table": table,
            "record_count": 42,
            "records": [
                {"id": 1, "topic": "Clarification on UPI 2.0 ₹5 Lakh limit", "author": "pravin", "status": "persisted"},
                {"id": 2, "topic": "RuPay Card Security Protocol (v4.0)", "author": "neha_compliance", "status": "persisted"},
                {"id": 3, "topic": "UPI Daily Velocity Breach Complaint", "author": "system_bot", "status": "complaint_flagged"}
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
