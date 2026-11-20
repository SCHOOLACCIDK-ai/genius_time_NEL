
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const SITE_DIR = __dirname;

const FILES = [
  "index.html",
  "style.css",
  "app.js"
];

app.use(express.json({ limit: "200kb" }));

// Keep original website files in memory.
const originalFiles = {};

for (const file of FILES) {
  const filePath = path.join(SITE_DIR, file);

  if (!fs.existsSync(filePath)) {
    throw new Error("Missing website file: " + file);
  }

  originalFiles[file] = fs.readFileSync(filePath, "utf8");
}

// Five-minute reset timer.
let resetTimer = null;

function resetWebsite() {
  for (const file of FILES) {
    fs.writeFileSync(
      path.join(SITE_DIR, file),
      originalFiles[file],
      "utf8"
    );
  }

  resetTimer = null;
  console.log("Website restored to original files.");
}

function scheduleReset() {
  if (resetTimer) {
    clearTimeout(resetTimer);
  }

  resetTimer = setTimeout(() => {
    resetWebsite();
  }, 5 * 60 * 1000);

  console.log("Website reset scheduled in 5 minutes.");
}

// Homepage.
app.get("/", (req, res, next) => {
  res.sendFile(path.join(SITE_DIR, "index.html"));
});

// Code editor.
app.get("/code", (req, res) => {
  res.send(editorPage);
});

// Read website files.
app.get("/code/files/:file", (req, res) => {
  const file = req.params.file;

  if (!FILES.includes(file)) {
    return res.status(404).send("File not found");
  }

  res.type("text/plain").send(
    fs.readFileSync(path.join(SITE_DIR, file), "utf8")
  );
});

// Save website files.
app.post("/code/files/:file", (req, res) => {
  const file = req.params.file;

  if (!FILES.includes(file)) {
    return res.status(404).json({
      error: "File not allowed"
    });
  }

  if (typeof req.body.content !== "string") {
    return res.status(400).json({
      error: "Invalid content"
    });
  }

  fs.writeFileSync(
    path.join(SITE_DIR, file),
    req.body.content,
    "utf8"
  );

  scheduleReset();

  res.json({
    success: true,
    message: "Saved! Resetting in 5 minutes."
  });
});

// Editor interface.
const editorPage = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Website Code Editor</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 25px;
  background: #101010;
  color: white;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 1100px;
  margin: auto;
}

h1 {
  margin-bottom: 8px;
}

p {
  color: #aaa;
}

select, button {
  padding: 12px 16px;
  border: none;
  border-radius: 7px;
  margin: 10px 5px 10px 0;
}

select {
  background: #252525;
  color: white;
}

button {
  background: #5865f2;
  color: white;
  cursor: pointer;
}

button:hover {
  opacity: .8;
}

textarea {
  width: 100%;
  height: 65vh;
  padding: 18px;
  resize: vertical;
  background: #181818;
  color: #00ff99;
  border: 1px solid #333;
  border-radius: 10px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

#status {
  color: #00ff99;
}

.warning {
  color: #ffb84d;
}
</style>
</head>

<body>
<div class="container">

<h1>Website Code Editor</h1>
<p>Edit your website directly.</p>

<p class="warning">
Changes automatically reset 5 minutes after the latest save.
</p>

<select id="file">
<option value="index.html">index.html</option>
<option value="style.css">style.css</option>
<option value="app.js">app.js</option>
</select>

<button onclick="loadFile()">Load File</button>
<button onclick="saveFile()">Save Changes</button>

<textarea id="editor" spellcheck="false"
placeholder="Loading code..."></textarea>

<p id="status">Ready.</p>

</div>

<script>
const editor = document.getElementById("editor");
const fileSelect = document.getElementById("file");
const status = document.getElementById("status");

async function loadFile() {
  const file = fileSelect.value;

  status.textContent = "Loading...";

  try {
    const response = await fetch(
      "/code/files/" + encodeURIComponent(file)
    );

    if (!response.ok) {
      throw new Error("Could not load file");
    }

    editor.value = await response.text();
    status.textContent = "Loaded " + file;
  } catch (error) {
    status.textContent = error.message;
  }
}

async function saveFile() {
  const file = fileSelect.value;

  status.textContent = "Saving...";

  try {
    const response = await fetch(
      "/code/files/" + encodeURIComponent(file),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: editor.value
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Save failed");
    }

    status.textContent = result.message;
  } catch (error) {
    status.textContent = error.message;
  }
}

fileSelect.addEventListener("change", loadFile);

loadFile();
</script>

</body>
</html>
`;

// Serve website assets.
app.use(express.static(SITE_DIR));

// Start server.
app.listen(PORT, () => {
  console.log("Website running on port " + PORT);
});
