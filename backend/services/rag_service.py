import chromadb
import google.generativeai as genai
from config import Config
from utils.db import execute_query


class RAGService:
    """
    Service layer implementing Retrieval-Augmented Generation (RAG).
    Integrates ChromaDB for semantic vector search and Google's Gemini API 
    for natural language response generation based on queried menu items.
    """

    def __init__(self):
        # Initialize persistent vector database client for local storage
        self.chroma_client = chromadb.PersistentClient(path=Config.CHROMA_PERSIST_DIR)
        self.collection = self.chroma_client.get_or_create_collection(
            name="menu_items",
            metadata={"description": "FoodFlash menu items for semantic search"}
        )

        # Configure Generative AI model client using configured API key
        if Config.GEMINI_API_KEY:
            genai.configure(api_key=Config.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-flash-latest')
        else:
            self.model = None

        # Automatically populate the vector database on startup if empty
        if self.collection.count() == 0:
            self._seed_embeddings()

    def _seed_embeddings(self):
        """
        Extracts menu items from the relational database and ingests them 
        into ChromaDB. Creates vector embeddings from concatenated textual 
        representations of menu records to enable semantic search capabilities.
        """
        try:
            items = execute_query("SELECT * FROM vw_menu_full")
            if not items:
                return

            documents = []
            metadatas = []
            ids = []

            for item in items:
                doc = (
                    f"{item['name']} - {item['description'] or ''} | "
                    f"Category: {item['category']} | "
                    f"Price: ₹{item['price']} | "
                    f"{'Vegetarian' if item['is_veg'] else 'Non-Vegetarian'}"
                )
                documents.append(doc)
                metadatas.append({
                    'item_id': item['id'],
                    'name': item['name'],
                    'price': float(item['price']),
                    'is_veg': item['is_veg'],
                    'category': item['category']
                })
                ids.append(f"menu_{item['id']}")

            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"Seeded {len(documents)} menu items into ChromaDB")
        except Exception as e:
            print(f"Error seeding ChromaDB: {e}")

    def query(self, user_query, n_results=15):
        """
        Processes a user query by searching the vector database for relevant 
        menu items and generating a contextualized response using the LLM.
        
        Args:
            user_query (str): The natural language query from the user.
            n_results (int): Number of nearest neighbor documents to retrieve.
        """
        # Step 1: Execute similarity search against the embedded document collection
        results = self.collection.query(query_texts=[user_query], n_results=n_results)

        if not results['documents'][0]:
            return "I couldn't find any matching dishes. Try asking about a specific cuisine or dish!"

        # Construct the context window for the LLM using the retrieved documents
        context = "\n".join(results['documents'][0])
        metadatas = results['metadatas'][0]

        # Step 2: Inject context into the prompt template and call the LLM endpoint
        if self.model:
            prompt = f"""You are FoodFlash AI, a friendly food ordering assistant.
Based on these menu items from our database:

{context}

Answer the customer's question: "{user_query}"

Rules:
- Be helpful and suggest specific dishes with prices
- Keep response concise (2-3 sentences)
- Use food emojis
- If asked about veg/non-veg, filter accordingly
- Mention the restaurant name"""

            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                print("Gemini API Error:", e)
                return self._fallback_response(metadatas)
        else:
            return self._fallback_response(metadatas)

    def _fallback_response(self, metadatas):
        """
        Provides a static programmatic response when the LLM service is unreachable
        or disabled, utilizing only the metadata from the vector search results.
        """
        items = [f"🍽️ {m['name']} (₹{m['price']})" for m in metadatas[:3]]
        return "Here's what I found:\n" + "\n".join(items)
