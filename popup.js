const input = document.getElementById("noteInput");
const addBtn = document.getElementById("addNote");
const list = document.getElementById("notesList");
const toggle = document.getElementById("toggleNotes");
const themeBtn = document.getElementById("themeToggle");

const modal = document.getElementById("editorModal");
const editArea = document.getElementById("editArea");
const saveBtn = document.getElementById("saveEdit");
const copyBtn = document.getElementById("copyNote");
const closeBtn = document.getElementById("closeModal");

let currentNoteId = null;

function createNoteId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeNote(note) {
  const content = typeof note?.content === "string" ? note.content : "";
  const title = typeof note?.title === "string" ? note.title : content.split("\n")[0] || "Untitled";
  return {
    id: note?.id || createNoteId(),
    title,
    content
  };
}

function getNotes(callback) {
  chrome.storage.local.get(["notes"], (result) => {
    const rawNotes = Array.isArray(result.notes) ? result.notes : [];
    const notes = rawNotes.map(normalizeNote);
    callback(notes);
  });
}

function setNotes(notes, callback) {
  chrome.storage.local.set({ notes }, callback);
}

function setNotesExpanded(expanded) {
  list.classList.toggle("hidden", !expanded);
  list.hidden = !expanded;
  toggle.textContent = expanded ? "⬆" : "⬇";
  toggle.setAttribute("aria-expanded", String(expanded));
}

// Load notes
function loadNotes() {
  getNotes((notes) => {
    list.innerHTML = "";

    notes.forEach((note) => {
      const li = document.createElement("li");

      const noteBtn = document.createElement("button");
      noteBtn.type = "button";
      noteBtn.className = "note-title";
      noteBtn.textContent = note.title;
      noteBtn.onclick = () => openEditor(note.id);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.setAttribute("aria-label", `Delete note: ${note.title}`);
      delBtn.textContent = "✕";
      delBtn.onclick = () => deleteNote(note.id);

      li.appendChild(noteBtn);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  });
}

// Add note
addBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;

  const lines = text.split("\n");

  const note = {
    id: createNoteId(),
    title: lines[0],
    content: text
  };

  getNotes((notes) => {
    notes.push(note);

    setNotes(notes, () => {
      input.value = "";
      loadNotes();
    });
  });
};

// Delete
function deleteNote(noteId) {
  getNotes((notes) => {
    const nextNotes = notes.filter((note) => note.id !== noteId);
    setNotes(nextNotes, loadNotes);
  });
}

// Toggle notes
toggle.onclick = () => {
  const isExpanded = !list.classList.contains("hidden") && !list.hidden;
  setNotesExpanded(!isExpanded);
};

// Theme toggle
themeBtn.onclick = () => {
  document.documentElement.classList.toggle("dark");

  chrome.storage.local.set({
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light"
  });
};

// Load theme
chrome.storage.local.get(["theme"], (result) => {
  if (result.theme === "dark") {
    document.documentElement.classList.add("dark");
  }
});

// Open editor
function openEditor(noteId) {
  getNotes((notes) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    modal.classList.remove("hidden");
    editArea.value = note.content;
    currentNoteId = note.id;
    editArea.focus();
  });
}

// Save edit
saveBtn.onclick = () => {
  if (!currentNoteId) {
    return;
  }

  getNotes((notes) => {
    const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
    if (noteIndex === -1) {
      modal.classList.add("hidden");
      currentNoteId = null;
      loadNotes();
      return;
    }

    const updated = editArea.value;
    const trimmed = updated.trim();

    if (!trimmed) {
      const nextNotes = notes.filter((note) => note.id !== currentNoteId);
      setNotes(nextNotes, () => {
        modal.classList.add("hidden");
        currentNoteId = null;
        loadNotes();
      });
      return;
    }

    const lines = trimmed.split("\n");

    notes[noteIndex] = {
      id: currentNoteId,
      title: lines[0],
      content: trimmed
    };

    setNotes(notes, () => {
      modal.classList.add("hidden");
      currentNoteId = null;
      loadNotes();
    });
  });
};

// Copy
copyBtn.onclick = () => {
  navigator.clipboard.writeText(editArea.value).catch((error) => {
    console.error("Copy failed", error);
  });
};

// Close modal
closeBtn.onclick = () => {
  modal.classList.add("hidden");
  currentNoteId = null;
};

modal.onclick = (event) => {
  if (event.target === modal) {
    modal.classList.add("hidden");
    currentNoteId = null;
  }
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    currentNoteId = null;
  }
});

// Init
setNotesExpanded(false);
loadNotes();