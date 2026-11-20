
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const SITE_DIR = __dirname;

const clients = [
  {
    id: "liquidbounce",
    name: "LiquidBounce",
    type: "Utility / combat client",
    color: "#5579bd",
    description: "An open-source client with extensive customization, scripts, and configurable modules.",
    bestFor: "Customization",
    openSource: true,
    customization: 5,
    pvp: 5,
    performance: 4,
    modSupport: 5,
    ease: 5,
    features: ["Open source", "Scripts", "Custom modules", "Custom HUD"],
    website: "https://liquidbounce.net/"
  },
  {
    id: "meteor",
    name: "Meteor Client",
    type: "Utility client",
    color: "#428c70",
    description: "An open-source Fabric utility client with many configurable modules.",
    bestFor: "Utility modules",
    openSource: true,
    customization: 5,
    pvp: 4,
    performance: 4,
    modSupport: 5,
    ease: 3,
    features: ["Open source", "Fabric", "Utility modules"],
    website: "https://meteorclient.com/"
  },
  {
    id: "lunar",
    name: "Lunar Client",
    type: "Client / launcher",
    color: "#477fb8",
    description: "A Minecraft client and launcher known for cosmetics, performance features, and supported mods.",
    bestFor: "Everyday PvP",
    openSource: false,
    customization: 3,
    pvp: 4,
    performance: 5,
    modSupport: 3,
    ease: 5,
    features: ["Cosmetics", "Performance features", "Built-in mods"],
    website: "https://www.lunarclient.com/"
  },
  {
    id: "badlion",
    name: "Badlion Client",
    type: "Client / launcher",
    color: "#ad853b",
    description: "A Minecraft client with integrated mods, HUD options, and cosmetics.",
    bestFor: "Convenience",
    openSource: false,
    customization: 3,
    pvp: 4,
    performance: 4,
    modSupport: 3,
    ease: 5,
    features: ["Integrated mods", "HUD customization", "Cosmetics"],
    website: "https://www.badlion.net/"
  }
];

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

// Only these website files can be edited.
const EDITABLE_FILES = [
  "index.html",
  "style.css",
  "app.js"
];

// Capture the original versions.
const originalFiles = {};

for (const name of EDITABLE_FILES) {
  const location = path.join(SITE_DIR, name);

  if (fs.existsSync(location)) {
    originalFiles[name] = fs.readFileSync(location, "utf8");
  }
}

// Temporary reset timer.
let resetTimer = null;

function resetWebsite() {
  for (const name of EDITABLE_FILES) {
    if (originalFiles[name] !== undefined) {
      fs.writeFileSync(
        path.join(SITE_DIR, name),
        originalFiles[name],
        "utf8"
      );
    }
  }

  resetTimer = null;
  console.log("Website restored to original code.");
}

function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);

  resetTimer = setTimeout(resetWebsite, 5 * 60 * 1000);

  console.log("Website reset scheduled for 5 minutes.");
}

function send(res, status, contentType, body) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff"
  });

  res.end(body);
}

// Editor HTML.
const editorHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Website Code Editor</title>
<style>
* { box-sizing: border-box; }

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

select, button {
  padding: 12px 16px;
  margin: 10px 5px 10px 0;
  border: none;
  border-radius: 7px;
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

textarea {
  width: 100%;
  height: 65vh;
  padding: 18px;
  background: #181818;
  color: #00ff99;
  border: 1px solid #333;
  border-radius: 10px;
  font-family: monospace;
  font-size: 14px;
}

#status { color: #00ff99; }
.warning { color: #ffb84d; }
</style>
</head>
<body>
<div class="container">
<h1>Website Code Editor</h1>
<p>Edit your website files directly.</p>
<p class="warning">Changes reset 5 minutes after the latest save.</p>

<select id="file">
<option value="index.html">index.html</option>
<option value="style.css">style.css</option>
<option value="app.js">app.js</option>
</select>

<button onclick="loadFile()">Load File</button>
<button onclick="saveFile()">Save Changes</button>

<textarea id="editor" spellcheck="false"></textarea>
<p id="status">Ready</p>
</div>

<script>
const editor = document.getElementById("editor");
const fileSelect = document.getElementById("file");
const status = document.getElementById("status");

async function loadFile() {
  status.textContent = "Loading...";

  try {
    const response = await fetch(
      "/code/files/" + encodeURIComponent(fileSelect.value)
    );

    if (!response.ok) throw new Error("Could not load file");

    editor.value = await response.text();
    status.textContent = "File loaded!";
  } catch (error) {
    status.textContent = error.message;
  }
}

async function saveFile() {
  status.textContent = "Saving...";

  try {
    const response = await fetch(
      "/code/files/" + encodeURIComponent(fileSelect.value),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.value })
      }
    );

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);

    status.textContent = result.message;
  } catch (error) {
    status.textContent = error.message;
  }
}

fileSelect.addEventListener("change", loadFile);
loadFile();
</script>
</body>
</html>`;

// Read request body safely.
function readBody(req, callback) {
  let body = "";
  let tooLarge = false;

  req.on("data", chunk => {
    body += chunk;

    if (Buffer.byteLength(body) > 200000) {
      tooLarge = true;
      req.destroy();
    }
  });

  req.on("end", () => {
    if (tooLarge) return;

    try {
      callback(null, JSON.parse(body));
    } catch {
      callback(new Error("Invalid JSON"));
    }
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = decodeURIComponent(url.pathname);

  // Editor page.
  if (pathname === "/code" || pathname === "/code/") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "text/plain", "Method not allowed");
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    return res.end(req.method === "HEAD" ? undefined : editorHTML);
  }

  // Editor: read files.
  if (pathname.startsWith("/code/files/")) {
    const name = pathname.slice("/code/files/".length);

    if (!EDITABLE_FILES.includes(name)) {
      return send(res, 404, "application/json", JSON.stringify({
        error: "File not allowed"
      }));
    }

    if (req.method === "GET") {
      const filePath = path.join(SITE_DIR, name);

      return fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          return send(res, 404, "application/json",
            JSON.stringify({ error: "File not found" }));
        }

        send(res, 200, "text/plain; charset=utf-8", data);
      });
    }

    // Editor: save files.
    if (req.method === "POST") {
      return readBody(req, (err, body) => {
        if (err) {
          return send(res, 400, "application/json",
            JSON.stringify({ error: "Invalid JSON" }));
        }

        if (typeof body.content !== "string") {
          return send(res, 400, "application/json",
            JSON.stringify({ error: "Invalid content" }));
        }

        fs.writeFile(
          path.join(SITE_DIR, name),
          body.content,
          "utf8",
          writeErr => {
            if (writeErr) {
              return send(res, 500, "application/json",
                JSON.stringify({ error: "Could not save file" }));
            }

            scheduleReset();

            send(res, 200, "application/json", JSON.stringify({
              success: true,
              message: "Saved! Resetting in 5 minutes."
            }));
          }
        );
      });
    }

    return send(res, 405, "text/plain", "Method not allowed");
  }

  // Original API: all clients.
  if (pathname === "/api/clients") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "text/plain", "Method not allowed");
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(
      req.method === "HEAD" ? undefined : JSON.stringify(clients)
    );
  }

  // Original API: individual clients.
  if (pathname.startsWith("/api/clients/")) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "text/plain", "Method not allowed");
    }

    const id = pathname.split("/").pop();
    const client = clients.find(item => item.id === id);

    res.writeHead(client ? 200 : 404, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(
      req.method === "HEAD"
        ? undefined
        : JSON.stringify(client || { error: "Client not found" })
    );
  }

  // Original static file serving.
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "text/plain; charset=utf-8",
      "Method not allowed");
  }

  const requested = pathname === "/"
    ? "index.html"
    : pathname.slice(1);

  const file = path.resolve(SITE_DIR, requested);

  if (!file.startsWith(SITE_DIR + path.sep)) {
    return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      return send(res, 404, "text/plain; charset=utf-8",
        "File not found");
    }

    res.writeHead(200, {
      "Content-Type":
        types[path.extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });

    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Website running on port ${PORT}`);
});
