const { createClient, findClient, findAllClients, findFollowUp, calculateScore } = require("../helpers/clients.helpers");

const getClient = async (ctx) => { // Get specific Client
    try {
        ctx.body = await findClient(ctx.request.params.id); // get client id from params

        ctx.status = 200;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = "Error!";
    }
};

const addClient = async (ctx) => { // Create new client
    try {
        ctx.body = await createClient(ctx.request.body); // create client using whole json body

        ctx.body = { status: "ok" } // Modify ctx.body so it will return this message after execution

        ctx.status = 201;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = "Error!";
    }
};

const getAllClients = async (ctx) => { // Get all clients
    try {
        ctx.body = await findAllClients(ctx.request.body);

        ctx.status = 201;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = "Error!";
    }
};

const getFollowUp = async (ctx) => { // Get those clients who's last message was more than a week ago to do follow up
    try {
        ctx.body = await findFollowUp(ctx.request.body);

        ctx.status = 201;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = "Error!";
    }
};

const getScore = async (ctx) => { // Calculate client score
    try {
        score = await calculateScore(ctx.request.params.id);
        ctx.body = { score };

        ctx.status = 200;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = "Error!";
    }
};

module.exports = {
    getClient,
    addClient,
    getAllClients,
    getFollowUp,
    getScore
};
