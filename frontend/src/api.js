const BASE_URL = "http://localhost:8000";

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed (${res.status})`);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    console.error(`API ${options.method || "GET"} ${path}:`, err);
    throw err;
  }
}

/* ── Attendance / Subjects ─────────────────────────────────── */

export async function fetchSubjects() {
  return request("/subjects");
}

export async function createSubject(data) {
  return request("/subjects", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      present: data.present,
      total: data.total,
      target: data.target,
    }),
  });
}

export async function updateSubject(id, action) {
  return request(`/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function deleteSubject(id) {
  return request(`/subjects/${id}`, { method: "DELETE" });
}

/* ── Timetable ─────────────────────────────────────────────── */

export async function fetchTimetable() {
  return request("/timetable");
}

export async function createTimetableEntry(data) {
  return request("/timetable", {
    method: "POST",
    body: JSON.stringify({
      subject_id: data.subject_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
    }),
  });
}

export async function deleteTimetableEntry(id) {
  return request(`/timetable/${id}`, { method: "DELETE" });
}

/* ── Notes ─────────────────────────────────────────────────── */

/** Normalise tags from comma-separated string to array */
function normalizeNote(note) {
  return {
    ...note,
    tags:
      typeof note.tags === "string"
        ? note.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : note.tags || [],
  };
}

export async function fetchNotes(tag) {
  const query = tag ? `?tag=${encodeURIComponent(tag)}` : "";
  const data = await request(`/notes${query}`);
  return (data || []).map(normalizeNote);
}

export async function createNote(data) {
  const note = await request("/notes", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      tags: data.tags,
    }),
  });
  return normalizeNote(note);
}

export async function deleteNote(id) {
  return request(`/notes/${id}`, { method: "DELETE" });
}

export async function summariseNote(id) {
  return request(`/notes/${id}/summarise`, { method: "POST" });
}

/* ── Tag Chat ──────────────────────────────────────────────── */

export async function tagChat(data) {
  return request("/chat/tag", {
    method: "POST",
    body: JSON.stringify({
      tag: data.tag,
      message: data.message,
      history: data.history,
    }),
  });
}

/* ── Noticeboard ───────────────────────────────────────────── */

export async function fetchNotices() {
  return request("/noticeboard");
}

export async function createNotice(data) {
  return request("/noticeboard", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      body: data.body,
      author: data.author,
    }),
  });
}

export async function togglePin(id) {
  return request(`/noticeboard/${id}/pin`, { method: "PATCH" });
}

/* ── Community ─────────────────────────────────────────────── */

export async function fetchMessages() {
  return request("/community");
}

export async function sendMessage(data) {
  return request("/community", {
    method: "POST",
    body: JSON.stringify({
      sender: data.sender,
      content: data.content,
    }),
  });
}
