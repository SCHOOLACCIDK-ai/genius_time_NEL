
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const clients = [
  
{
  id: "liquidbounce",
  name: "LiquidBounce",
  type: "Utility / combat client",
  color: "#b58aff",
  tagline: "Built for customization.",
  description:
    "An open-source Minecraft client focused on extensive customization, scripts, and configurable modules.",
  bestFor: "Advanced customization",
  openSource: true,
  customization: 5,
  pvp: 5,
  performance: 4,
  modSupport: 5,
  ease: 4,
  version: "Check official downloads",
  features: [
    "Open source",
    "Scripts",
    "Configurable modules",
    "Combat modules",
    "Custom HUD"
  ],
  website: "https://liquidbounce.net/"
},
  {
    id: "meteor",
    name: "Meteor Client",
    type: "Utility client",
    color: "#55d6a0",
    tagline: "A flexible utility experience.",
    description:
      "An open-source Fabric-based utility client known for its module selection and configurable interface.",
    bestFor: "Utility modules",
    openSource: true,
    customization: 5,
    pvp: 4,
    performance: 4,
    modSupport: 5,
    ease: 3,
    version: "Check official downloads",
    features: ["Fabric ecosystem", "Utility modules", "Custom HUD"],
    website: "https://meteorclient.com/"
  },
  {
    id: "lunar",
    name: "Lunar Client",
    type: "Client / launcher",
    color: "#61b8ff",
    tagline: "A polished everyday client.",
    description:
      "A popular client and launcher with performance features, cosmetics, and supported gameplay mods.",
    bestFor: "Everyday PvP",
    openSource: false,
    customization: 3,
    pvp: 4,
    performance: 5,
    modSupport: 3,
    ease: 5,
    version: "Check official downloads",
    features: ["Cosmetics", "Performance features", "Built-in mods"],
    website: "https://www.lunarclient.com/"
  },
  {
    id: "badlion",
    name: "Badlion Client",
    type: "Client / launcher",
    color: "#ffca75",
    tagline: "Features with a familiar setup.",
    description:
      "A Minecraft client offering an integrated collection of mods, HUD options, and cosmetic features.",
    bestFor: "Convenience",
    openSource: false,
    customization: 3,
    pvp: 4,
    performance: 4,
    modSupport: 3,
    ease: 5,
    version: "Check official downloads",
    features: ["Integrated mods", "HUD customization", "Cosmetics"],
    website: "https://www.badlion.net/"
  }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (url.pathname === "/api/clients") {
    return sendJson(res, 200, clients);
  }

  if (url.pathname.startsWith("/api/clients/")) {
    const id = url.pathname.split("/").pop();
    const client = clients.find(item => item.id === id);

    if (!client) {
      return sendJson(res, 404, { error: "Client not found" });
    }

    return sendJson(res, 200, client);
  }

  const requestedPath =
    url.pathname === "/" ? "index.html" : url.pathname.slice(1);

  const filePath = path.resolve(ROOT, requestedPath);

  if (!filePath.startsWith(ROOT + path.sep)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      return sendJson(res, 404, { error: "File not found" });
    }

    res.writeHead(200, {
      "Content-Type":
        mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });

    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BlockBench is running at http://localhost:${PORT}`);
});
