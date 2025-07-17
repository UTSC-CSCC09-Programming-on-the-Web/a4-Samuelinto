import { sequelize } from "./datasource.js";
import express from "express";
import bodyParser from "body-parser";
import { imagesRouter } from "./routers/images_router.js";
import { commentsRouter } from "./routers/comments_router.js";

import crypto from "crypto";
import { User } from "./models/user.js";
import { Token } from "./models/token.js";
import { authenticateToken } from "./middleware/authenticate.js";
import { authRouter } from "./routers/auth_router.js";

const PORT = 3000;
export const app = express();
app.use(bodyParser.json());

try {
  await sequelize.authenticate();
  await sequelize.query("PRAGMA foreign_keys = ON;");
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use("/uploads", express.static("uploads"));
app.use("/api/images", imagesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/auth", authRouter);
app.use(express.static("static"));

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
