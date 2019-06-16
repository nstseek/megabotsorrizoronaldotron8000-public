import * as fs from 'fs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

const server = express();

const port = 8080;

let urlsArray: any = null;

server.use(cors());

server.use(bodyParser.json({ limit: '10mb' }));

server.listen(port, () => {
    console.log(`extract server listening on port ${port}`);
});

server.post('/url', (req, res) => {
    if(req.body.url) {
        urlsArray = req.body.url;
        res.json(JSON.stringify({message: 'ok'}));
        fs.writeFileSync('urls.json', JSON.stringify(urlsArray));
    }
    else {
        res.status(400);
        res.json(JSON.stringify({message: 'error - no url'}));
    }
});