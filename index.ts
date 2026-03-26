import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));

const server = createServer(app);
registerRoutes(server, app);

export default app;
