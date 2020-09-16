'use strict';

const mysqlx = require('@mysql/xdevapi');
const http = require('http');

const port = 9999;

const statusOk = 200;
const statusNotFaund = 404;
const statusBadRequest = 400;
const statusInternalServerError = 500;
const schema = 'social';


function sendResponse(response, { status = statusOk, headers = {}, body = null }) {
    Object.entries(headers).forEach(function ([key, value]) {
        response.setHeader(key, value);
    });

    response.writeHead(status);
    response.end(body);
}

function sendJSON(response, body) {
    sendResponse(response, {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

function map(columns) {
    return row => row.reduce((res, value, i) => ({ ...res, [columns[i].getColumnLabel()]: value }), {});
}


const methods = new Map();

methods.set('/posts.get', async ({ response, db }) => {
    const table = db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created']).where('removed = :removed').bind('removed', false).orderBy('id DESC').execute();
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts);
});


methods.set('/posts.getById', async ({response, searchParams, db})=> {
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
  
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }
    const table = db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = false').bind('id', id).execute();
    const data = result.fetchAll();
    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });


  methods.set('/posts.post', async ({response, searchParams, db})=> {
    if (!searchParams.has('content')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    const content = searchParams.get('content');

    const table = db.getTable('posts');

    const result = await table.insert('content').values(content).execute();
    const removed = result.getAffectedItemsCount();
    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('content = :content').bind('content', content).execute();
    const data = secondResult.fetchAll();

    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });
  
  methods.set('/posts.edit', async ({response, searchParams, db})=> {
   
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }

    if (!searchParams.has('content')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    const content = searchParams.get('content');

    const table = db.getTable('posts');
    const result = await table.update().set('content', content).where('id = :id and removed=false').bind('id', id).execute();
    const removed = result.getAffectedItemsCount();

    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = false').bind('id', id).execute();
    const data = secondResult.fetchAll();

    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });


  methods.set('/posts.delete', async ({response, searchParams, db})=> {
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
  
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }
    const table = db.getTable('posts');

    const result = await table.update().set('removed', true).where('id = :id and removed=false').bind('id', id).execute();
    const removed = result.getAffectedItemsCount();

    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = true').bind('id', id).execute();
    const data = secondResult.fetchAll();
    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });


  methods.set('/posts.restore', async ({response, searchParams, db})=> {
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
  
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }
    const table = db.getTable('posts');

    const result = await table.update().set('removed', false).where('id = :id and removed=true').bind('id', id).execute();
    const removed = result.getAffectedItemsCount();

    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = false').bind('id', id).execute();
    const data = secondResult.fetchAll();
    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });


  methods.set('/posts.like', async ({response, searchParams, db})=> {
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
  
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }

    
    const table = db.getTable('posts');
    
    const resultLikesdata = await table.select(['likes']).where('id = :id and removed = false').bind('id', id).execute();
    const dataLikesdata = resultLikesdata.fetchAll();
    
    if (dataLikesdata.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
   
    const addLike = dataLikesdata[0][0] + 1;

    const result = await table.update().set('likes', addLike).where('id = :id and removed=false').bind('id', id).execute();
    const removed = result.getAffectedItemsCount();

    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = false').bind('id', id).execute();
    const data = secondResult.fetchAll();
    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);

  });


  methods.set('/posts.dislike', async ({response, searchParams, db})=> {
    if (!searchParams.has('id')){
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const id = Number(searchParams.get('id'));
  
    if (Number.isNaN(id)){
      sendResponse(response, {status: statusBadRequest});
      return;
    }

    
    const table = db.getTable('posts');
    
    const resultLikesdata = await table.select(['likes']).where('id = :id and removed = false').bind('id', id).execute();
    const dataLikesdata = resultLikesdata.fetchAll();

    if (dataLikesdata.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
   
    const addLike = dataLikesdata[0][0] - 1;

    const result = await table.update().set('likes', addLike).where('id = :id and removed=false').bind('id', id).execute();
    const removed = result.getAffectedItemsCount();

    if (removed === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }

    const secondResult = await table.select(['id', 'content', 'likes', 'created']).where('id = :id and removed = false').bind('id', id).execute();
    const data = secondResult.fetchAll();
    if (data.length === 0) {
        sendResponse(response, {status: statusNotFaund});
        return;
    }
    const columns = secondResult.getColumns();
    const posts = data.map(map(columns));
    sendJSON(response, posts[0]);
  });

const server = http.createServer(async (request, response) => {

    const { pathname, searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const method = methods.get(pathname);

    if (method === undefined) {
        sendResponse(response, { status: statusNotFaund });
        return;
    }


    let session = null;
    try {
        const client = mysqlx.getClient({
            user: 'app',
            password: 'pass',
            host: 'localhost',
            port: '33060',
        });

        session = await client.getSession();
        const db = await session.getSchema(schema);

        const params = {
            request,
            response,
            pathname,
            searchParams,
            db,
        };

        await method(params);

    } catch (e) {
        sendResponse(response, { status: statusInternalServerError });
    } finally {
        if (session !== null) {
            try {
                await session.close();
            } catch (e) {
                console.log(e);
            }
        }
    }


});

server.listen(port);