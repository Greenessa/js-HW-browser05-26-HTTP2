import http from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';
import cors from '@koa/cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import serve from 'koa-static';


let list = [];

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = new Koa();

app.use(cors());
app.use(serve('uploads'));
app.use(koaBody({
  urlencoded: true,
  multipart: true,
  json: true,
}));


app.use(async (ctx) => {
  if (ctx.path === '/upload' && ctx.method === 'POST') {
    const file = ctx.request.files?.file;
  
    if (!file) {
      ctx.status = 400;
      ctx.body = { error: 'Файл не получен' };
      return;
    }
    const ext = path.extname(file.name); 
    const safeName = `${uuidv4()}${ext}`;
    const filePath = path.resolve(`uploads/${safeName}`);

    // const safeName = path.basename(file.name);
    // const filePath = path.resolve(`uploads/${safeName}`);
  
    const reader = fs.createReadStream(file.path);
    const stream = fs.createWriteStream(filePath);
  
    await new Promise((resolve, reject) => {
      reader.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    list.push({
      id: uuidv4(),
      filename: safeName,
      src: `http://localhost:7070/${safeName}`,
    });

    ctx.body = {
      status: 'ok',
      src: `http://localhost:7070/${safeName}`,
      list
    };
    return;
  }
  if (ctx.path === '/images' && ctx.method === 'GET') {
    const files = await fsp.readdir('uploads');
  
    ctx.body = files.map((filename) => ({
      id: filename,
      filename,
      src: `http://localhost:7070/${filename}`,
    }));
  
    return;
  }
  if (ctx.request.method === 'POST') {
    const { method } = ctx.request.query;
    if (method === 'removeImage') {
      const { filename } = ctx.request.body;
      const safePath = path.basename(filename);
      const filePath = path.resolve(`uploads/${safePath}`);

      try {
        await fsp.unlink(filePath);
        list = list.filter((image) => image.filename !== safePath);
        ctx.body = { status: 'ok' };
      } catch (err) {
        ctx.status = 500;
        ctx.body = { error: 'Не удалось удалить файл' };
      }
    }
  }

  
});





const server = http.createServer(app.callback());
const port = 7070;

server.listen(port, (err) => {
  if (err) {
    console.log('Error occured:', err);
    return;
  }

  console.log(`Server is listening on ${port}`);
});