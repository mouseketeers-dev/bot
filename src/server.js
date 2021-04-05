import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";

function start(port, mhPage) {
  const app = new Koa();
  const router = new Router();
  const page = mhPage.pptrPage;

  router.get("/test", ctx => {
    ctx.body = { "status": true };
  });

  router.get("/screenshot", async ctx => {
    const img = await page
      .$("#mousehuntContainer")
      .then(el => el.screenshot({}));
    ctx.type = 'image/png';
    ctx.body = img;
  });

  router.post("/arm", async ctx => {
    try {
      const setup = ctx.request.body;
      await mhPage.armItems(setup);
      ctx.body = { "status": true };
    } catch (err) {
      console.error(err);
      ctx.body = { "status": false, error: err.message };
    }
  });

  app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(port);
  console.log("Server is running at :" + port + ".\n");
}

export default {
  start
};
