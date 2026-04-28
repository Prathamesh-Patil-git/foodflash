from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint('chatbot', __name__)

# RAG service is optional (requires chromadb + google-generativeai)
rag = None
try:
    from services.rag_service import RAGService
    rag = RAGService()
except ImportError:
    print("Warning: ChromaDB/Gemini not installed - chatbot will return fallback responses")


@chatbot_bp.route('', methods=['POST'])
def chat():
    """
    Endpoint for processing natural language customer queries via the AI chatbot.
    Receives a JSON payload with the user 'query', invokes the RAG service to find
    relevant menu context, and returns a generated contextual response.
    Returns HTTP 400 if the query parameter is missing or empty.
    """
    data = request.get_json()
    query = data.get('query', '')

    if not query:
        return jsonify({'error': 'Query is required'}), 400

    if rag:
        response = rag.query(query)
    else:
        response = f"I'd love to help with '{query}'! The AI chatbot requires ChromaDB to be installed. For now, check out our menu page for recommendations! 🍔"

    return jsonify({'response': response})
