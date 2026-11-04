const http = require("node:http");
const fs = require("node:fs");
const path = node = require("node:path"); // keep your path/fs imports
const { Server } = require("socket.io"); // 1. Import socket.io

const PORT = process.env.PORT || 3000;

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
    ease: 4,
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

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method not allowed");
  }

  if (url.pathname === "/api/clients") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });
    return res.end(JSON.stringify(clients));
  }

  if (url.pathname.startsWith("/api/clients/")) {
    const id = url.pathname.split("/").pop();
    const client = clients.find(item => item.id === id);

    res.writeHead(client ? 200 : 404, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(JSON.stringify(client || { error: "Client not found" }));
  }

  const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.resolve(__dirname, requested);

  if (!file.startsWith(__dirname + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("File not found");
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });

    res.end(req.method === "HEAD" ? undefined : data);
  });
});

// 2. Attach Socket.io to your existing HTTP server
const io = new Server(server);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("trigger-funny", () => {
    console.log(`Funny sound triggered by ${socket.id}! Broadcasting to everyone.`);
    io.emit("play-funny-sound"); // Broadcasts to all connected tabs/users
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Website running on port ${PORT}`);
});
