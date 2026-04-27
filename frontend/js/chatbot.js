// ===== FoodFlash — Chatbot JS Module =====
// RAG chatbot using ChromaDB + Gemini via Flask API
var API = window.FOODFLASH_API || 'http://localhost:5000/api';

const chatToggle = document.getElementById('chatbotToggle');
const chatWindow = document.getElementById('chatbotWindow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

// Toggle chatbot window
chatToggle?.addEventListener('click', () => {
  chatWindow?.classList.toggle('open');
  if (chatWindow?.classList.contains('open')) chatInput?.focus();
});

// Send message
async function sendChatMessage() {
  const msg = chatInput?.value?.trim();
  if (!msg || !chatMessages) return;

  // User message bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.textContent = msg;
  chatMessages.appendChild(userDiv);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg bot typing';
  typingDiv.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${API}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: msg })
    });

    typingDiv.remove();

    if (res.ok) {
      const data = await res.json();
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-msg bot';
      botDiv.innerHTML = formatBotResponse(data.response || data.message || 'I found some results for you!');
      chatMessages.appendChild(botDiv);
    } else {
      throw new Error('API error');
    }
  } catch {
    typingDiv.remove();
    const botDiv = document.createElement('div');
    botDiv.className = 'chat-msg bot';
    botDiv.innerHTML = 'Sorry, the AI assistant is currently offline. Please try again later.';
    chatMessages.appendChild(botDiv);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format bot response (supports markdown-like formatting)
function formatBotResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/₹(\d+)/g, '<span style="color:var(--accent-orange);font-weight:700;">₹$1</span>')
    .replace(/\n/g, '<br>');
}

chatSend?.addEventListener('click', sendChatMessage);
chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
