import express from "express";
import bodyParser from "body-parser";
import router from "./router.js";

const PORT = 5000;

const app = express();

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));

app.use(bodyParser.json());

app.use("/api", router);

async function startApp() {
  try {
    //CODE HERE
    app.listen(PORT, () => console.log("SERVER STARTED ON PORT " + PORT));
    //CODE HERE
  } catch (e) {
    console.log(e);
  }
}

startApp();
