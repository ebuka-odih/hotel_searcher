import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hotel_agent.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    city TEXT,
    checkIn TEXT,
    checkOut TEXT,
    guests TEXT,
    rooms INTEGER,
    budget TEXT,
    amenities TEXT,
    sites TEXT,
    mode TEXT,
    status TEXT,
    createdAt TEXT,
    results TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/history", (req, res) => {
    const runs = db.prepare("SELECT * FROM runs ORDER BY createdAt DESC").all();
    res.json(runs.map(run => ({
      ...run,
      guests: JSON.parse(run.guests as string),
      budget: JSON.parse(run.budget as string),
      amenities: JSON.parse(run.amenities as string),
      sites: JSON.parse(run.sites as string),
      results: JSON.parse(run.results as string)
    })));
  });

  app.post("/api/runs", (req, res) => {
    const run = req.body;
    const stmt = db.prepare(`
      INSERT INTO runs (id, city, checkIn, checkOut, guests, rooms, budget, amenities, sites, mode, status, createdAt, results)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      run.id,
      run.city,
      run.checkIn,
      run.checkOut,
      JSON.stringify(run.guests),
      run.rooms,
      JSON.stringify(run.budget),
      JSON.stringify(run.amenities),
      JSON.stringify(run.sites),
      run.mode,
      run.status,
      run.createdAt,
      JSON.stringify(run.results)
    );
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
