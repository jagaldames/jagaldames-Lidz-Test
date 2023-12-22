// The core of this code was built using this tutorial https://dev.to/kachiic/koa-js-part-1-how-to-make-a-koa-server-in-10-minutes-3og9 parts 1 and 4

const Koa = require("koa");
const parser = require("koa-bodyparser");
const cors = require("@koa/cors");
const router = require("./router");
const App = new Koa();
const port = 8000;

App.use(parser())
  .use(cors())
  .use(router.routes())
  .listen(port, () => {
    console.log(`🚀 Server listening http://127.0.0.1:${port}/ 🚀`);
  });
