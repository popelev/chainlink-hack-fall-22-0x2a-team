import Router from "express";
import Postcontroller from "./PostController.js";
const router = new Router();

router.post("/posts", Postcontroller.JsonParse);
router.get("/posts", (req, res) => {
  console.log("GET");
});

export default router;
