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

let currentIndex = null;

// Load notes
function loadNotes() {
  chrome.storage.local.get(["notes"], (result) => {
    const notes = result.notes || [];
    list.innerHTML = "";

    notes.forEach((note, index) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = note.title;
      span.onclick = () => openEditor(note, index);

      const delBtn = document.createElement("button");
      delBtn.textContent = "✕";
      delBtn.onclick = () => deleteNote(index);

      li.appendChild(span);
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
    title: lines[0],
    content: text
  };

  chrome.storage.local.get(["notes"], (result) => {
    const notes = result.notes || [];
    notes.push(note);

    chrome.storage.local.set({ notes }, () => {
      input.value = "";
      loadNotes();
    });
  });
};

// Delete
function deleteNote(index) {
  chrome.storage.local.get(["notes"], (result) => {
    let notes = result.notes || [];
    notes.splice(index, 1);
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// Toggle notes
toggle.onclick = () => {
  list.classList.toggle("hidden");

  // change arrow direction
  if (list.classList.contains("hidden")) {
    toggle.textContent = "Recent Notes ⬇";
  } else {
    toggle.textContent = "Recent Notes ⬆";
  }
};

// Theme toggle
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");

  chrome.storage.local.set({
    theme: document.body.classList.contains("dark") ? "dark" : "light"
  });
};

// Load theme
chrome.storage.local.get(["theme"], (result) => {
  if (result.theme === "dark") {
    document.body.classList.add("dark");
  }
});

// Open editor
function openEditor(note, index) {
  modal.classList.remove("hidden");
  editArea.value = note.content;
  currentIndex = index;
}

// Save edit
saveBtn.onclick = () => {
  chrome.storage.local.get(["notes"], (result) => {
    let notes = result.notes || [];

    const updated = editArea.value;
    const lines = updated.split("\n");

    notes[currentIndex] = {
      title: lines[0],
      content: updated
    };

    chrome.storage.local.set({ notes }, () => {
      modal.classList.add("hidden");
      loadNotes();
    });
  });
};

// Copy
copyBtn.onclick = () => {
  navigator.clipboard.writeText(editArea.value);
};

// Close modal
closeBtn.onclick = () => {
  modal.classList.add("hidden");
};

// Init
loadNotes();