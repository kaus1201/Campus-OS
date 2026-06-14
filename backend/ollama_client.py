"""
Campus OS — Ollama AI Client
Handles all AI interactions: summarisation, auto-tagging, tag-scoped chat.
Calls Ollama's local API at http://localhost:11434/api/chat
"""
import httpx

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.1"
TIMEOUT = 60.0


async def _call_ollama(messages: list[dict]) -> str:
    """Send messages to Ollama and return the assistant's reply."""
    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()
    except httpx.ConnectError:
        return "[Error] Could not connect to Ollama. Make sure it's running: `ollama serve`"
    except httpx.ReadTimeout:
        return "[Error] Ollama request timed out. The model may still be loading."
    except Exception as e:
        return f"[Error] Ollama call failed: {str(e)}"


async def summarise_note(title: str, content: str) -> str:
    """Generate a 3-4 bullet point summary of a note."""
    messages = [
        {
            "role": "system",
            "content": (
                "You are a concise academic assistant. "
                "Summarise the given note in exactly 3-4 bullet points. "
                "Each bullet should be one clear sentence. "
                "Use • as the bullet character. "
                "Do not include any preamble or closing text — just the bullets."
            ),
        },
        {
            "role": "user",
            "content": f"Title: {title}\n\nContent:\n{content}",
        },
    ]
    return await _call_ollama(messages)


async def suggest_tags(title: str, content: str, existing_tags: list[str]) -> list[str]:
    """Suggest additional tags for a note. Returns a list of tag strings."""
    messages = [
        {
            "role": "system",
            "content": (
                "You are an academic tagging assistant. "
                "Given a note's title and content, suggest 3-5 relevant academic tags. "
                "Tags should be lowercase, hyphenated if multi-word (e.g., 'machine-learning'). "
                "Only return new tags not already in the existing list. "
                "Return ONLY a comma-separated list of tags, nothing else. "
                "Example output: dynamic-programming,complexity,sorting"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Title: {title}\n\n"
                f"Content:\n{content}\n\n"
                f"Existing tags: {', '.join(existing_tags) if existing_tags else 'none'}"
            ),
        },
    ]
    raw = await _call_ollama(messages)

    # If there was an error, return empty list
    if raw.startswith("[Error]"):
        return []

    # Parse comma-separated tags
    suggested = []
    for tag in raw.split(","):
        tag = tag.strip().lower().strip(".")
        # Filter out junk
        if tag and len(tag) < 40 and not tag.startswith("["):
            suggested.append(tag)
    return suggested


async def tag_chat(tag: str, notes_context: str, message: str, history: list[dict]) -> str:
    """
    Answer a question scoped to notes with a specific tag.
    notes_context: concatenated content of all notes with this tag.
    history: list of {"role": "user"/"assistant", "content": "..."} dicts.
    """
    system_msg = {
        "role": "system",
        "content": (
            f"You are a helpful academic assistant. "
            f"The student is asking about their notes tagged '{tag}'. "
            f"Below are all their notes with this tag — use them to answer questions.\n\n"
            f"--- NOTES ---\n{notes_context}\n--- END NOTES ---\n\n"
            f"Answer clearly and concisely. If the notes don't contain enough info, "
            f"say so and offer general knowledge. Use bullet points where helpful."
        ),
    }

    messages = [system_msg] + history + [{"role": "user", "content": message}]
    return await _call_ollama(messages)
