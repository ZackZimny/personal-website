interface ChatMessage {
  name: string;
  message: string;
  timestamp: number;
}

async function fetchChatMessages() {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  try {
    const response = await fetch("/api/chat");
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const messages: ChatMessage[] = await response.json();
    if (messages.length === 0) {
      container.innerHTML = `<p>No messages yet. Be the first to say hi!</p>`;
      return;
    }

    container.innerHTML = messages
      .map((m) => `
        <div class="chat-message-item">
          <div class="chat-message-header">
            <span class="chat-message-name">${m.name}</span>
            <span class="chat-message-date">${new Date(m.timestamp).toLocaleString()}</span>
          </div>
          <div class="chat-message-body">${m.message}</div>
        </div>
      `)
      .join("");
  } catch (error) {
    console.error("Error fetching messages:", error);
    container.innerHTML = `<p>Chat currently unavailable.</p>`;
  }
}

async function setupChatForm() {
  const form = document.getElementById("chat-form") as HTMLFormElement;
  const nameInput = document.getElementById("chat-name") as HTMLInputElement;
  const messageInput = document.getElementById("chat-message") as HTMLTextAreaElement;
  const submitBtn = document.getElementById("chat-submit") as HTMLButtonElement;

  if (!form) return;

  // Load saved name from localStorage
  const savedName = localStorage.getItem("chat-name");
  if (savedName) {
    nameInput.value = savedName;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    // Save name for next time
    localStorage.setItem("chat-name", name);

    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      messageInput.value = "";
      await fetchChatMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Send Message";
    }
  });
}

// Polling for new messages every 10 seconds
setInterval(fetchChatMessages, 10000);

fetchChatMessages();
setupChatForm();
