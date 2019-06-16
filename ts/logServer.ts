import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import ResponseMsg from './ResponseMsg';
import Status from './Status';

const server = express();

const port = 7000;

server.use(cors());

server.use(bodyParser.json({ limit: '10mb' }));

server.listen(port, () => {
    console.log(`log server listening on port ${port}`);
});

server.post(`/log`, (req, res) => {
    let now = new Date();
    console.log(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()} | -------${req.body.id} = ${req.body.log}`);
    res.json(JSON.stringify(new ResponseMsg(`ok`, Status.complete)));
});