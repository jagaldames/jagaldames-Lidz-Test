const Router = require("koa-router");
const router = new Router();
const { getClient, addClient, getAllClients, getFollowUp, getScore } = require("./controllers/clients.controllers");

// Declare endpoints and controllers to use
router.get("/clients", getAllClients)
router.get("/clients/:id", getClient)
router.get("/clients-to-do-follow-up", getFollowUp)
router.get("/clients/:id/score", getScore)
router.post("/clients", addClient)

module.exports = router;
