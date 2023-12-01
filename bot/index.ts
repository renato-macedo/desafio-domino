import express from "express";
import { playGame } from "./domino";

const app = express();

app.use(express.json());
app.all("/", (req, res) => {
  const move = playGame(req.body);

  return res.json(move ?? {});
});

const port = 8000;
app.listen(port, () => console.log(`Listening on port ${port}`));
