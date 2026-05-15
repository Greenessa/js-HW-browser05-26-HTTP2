import http from "http";
import Koa from "koa";
import koaBody from "koa-body";
import cors from "@koa/cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";

const app = new Koa();
const port = 7070;
const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());

app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
    json: true,
  }),
);

app.use(async (ctx) => {
  if (ctx.path === "/files" && ctx.method === "GET") {
    const files = await fsp.readdir(uploadDir);

    const result = files.map((file) => {
      const id = path.parse(file).name;

      return {
        id,
        filename: file,
        src: `http://localhost:${port}/files/${id}`,
      };
    });

    ctx.body = result;
    return;
  }

  if (ctx.path === "/files" && ctx.method === "POST") {
    const file = ctx.request.files?.file;

    if (!file) {
      ctx.status = 400;
      ctx.body = { error: "Файл не получен" };
      return;
    }

    const id = uuidv4();
    const ext = path.extname(file.name);
    const filename = `${id}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const reader = fs.createReadStream(file.path);
    const stream = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      reader.pipe(stream);
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    ctx.body = {
      id,
      filename,
      src: `http://localhost:${port}/files/${id}`,
    };

    return;
  }

  if (ctx.path.startsWith("/files/") && ctx.method === "GET") {
    const id = ctx.path.split("/").pop();

    const files = await fsp.readdir(uploadDir);
    const filename = files.find((file) => path.parse(file).name === id);

    if (!filename) {
      ctx.status = 404;
      ctx.body = { error: "Файл не найден" };
      return;
    }

    ctx.type = path.extname(filename);
    ctx.body = fs.createReadStream(path.join(uploadDir, filename));
    return;
  }

  if (ctx.path.startsWith("/files/") && ctx.method === "DELETE") {
    const id = ctx.path.split("/").pop();

    const files = await fsp.readdir(uploadDir);
    const filename = files.find((file) => path.parse(file).name === id);

    if (!filename) {
      ctx.status = 404;
      ctx.body = { error: "Файл не найден" };
      return;
    }

    await fsp.unlink(path.join(uploadDir, filename));

    ctx.body = { status: "ok" };
    return;
  }

  ctx.status = 404;
  ctx.body = { error: "Endpoint не найден" };
});

const server = http.createServer(app.callback());

server.listen(port, (err) => {
  if (err) {
    console.log("Error occured:", err);
    return;
  }

  console.log(`Server is listening on ${port}`);
});