import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import BrowserTab from './BrowserTab';
import ResponseMsg from './ResponseMsg';
import Status from './Status';

const server = express();

const port = 8000;

let browsersArray: BrowserTab[] = [];

childProcess.execSync(`mkdir -pv createdHTMLs`, { stdio: 'inherit' });

let videotags: string[] = [];

let fixedResponse = {
    response: 'data arrived, <html> and video saved.'
};

const checkUser = (id: string, isSubid: boolean = false): BrowserTab => {
    for (let i = 0; i < browsersArray.length; i++) {
        if (browsersArray[i].id == id && !isSubid) {
            return browsersArray[i];
        } else if (browsersArray[i].subid == id && isSubid) {
            return browsersArray[i];
        }
    }
    return null;
};

const testType = (param: String | Number | BrowserTab | ResponseMsg) => {
    if (param instanceof String) console.log('this is a String. ' + param);
    else if (param instanceof Number) console.log('this is a Number. ' + param);
    else if (param instanceof BrowserTab) console.log('this is a BrowserTab.');
    else if (param instanceof ResponseMsg)
        console.log('this is a ResponseMsg.');
};

const reportStatus = (param: string | BrowserTab): ResponseMsg => {
    let tempObj: BrowserTab;
    if (param instanceof BrowserTab) {
        tempObj = param;
    } else {
        tempObj = checkUser(param);
    }
    if (tempObj) {
        switch (tempObj.code) {
            case Status.denied:
                return new ResponseMsg(
                    `SUBID '${
                        tempObj.subid
                    }' is now waiting for permission to download`,
                    Status.denied
                );
            case Status.ready:
                return new ResponseMsg(
                    `SUBID '${tempObj.subid}' can download now`,
                    Status.ready
                );
            case Status.downloading:
                return new ResponseMsg(
                    `SUBID '${tempObj.subid}' is downloading now`,
                    Status.downloading
                );
            case Status.complete:
                return new ResponseMsg(
                    `SUBID '${tempObj.subid}' completed download`,
                    Status.complete
                );
            case Status.error:
                return new ResponseMsg(
                    `SUBID '${tempObj.subid}' has an error`,
                    Status.error
                );
            default:
                break;
        }
    }
    return null;
};

let linksArray: string[] = [];
let linksArrayIndex = 0;

if (process.argv[2] == '--filelinks') {
    let file = fs.readFileSync('urls.json', 'utf-8');
    linksArray = JSON.parse(file);
    console.log(`${linksArray.length} urls read`);
}

server.use(cors());

server.use(bodyParser.json({ limit: '10mb' }));

server.listen(port, () => {
    console.log(`server listening on port ${port}`);
});

server.post('/link', (req, res) => {
    if (req.body.html) {
        linksArray.push(req.body.html);
        console.log(`Link ${req.body.html} added.`);
        res.json(JSON.stringify(new ResponseMsg(`Link ${req.body.html} added.`, Status.ready)));

    } else {
        console.log('ERROR - no link was passed!');
        res.json(
            JSON.stringify(new ResponseMsg('ERROR - no link was passed!', Status.error))
        );
    }
});

server.post('/linkarray', (req, res) => {
    if (req.body.html) {
        linksArray = linksArray.concat(req.body.html);
        console.log(`Link array ${req.body.html} added.`);
        res.json(JSON.stringify(new ResponseMsg(`Link array ${req.body.html} added.`, Status.ready)));

    } else {
        console.log('ERROR - no link was passed!');
        res.json(
            JSON.stringify(new ResponseMsg('ERROR - no link was passed!', Status.error))
        );
    }
});

server.get('/link', (req, res) => {
    if (!(linksArrayIndex < linksArray.length)) {
        res.json(JSON.stringify(new ResponseMsg('ERROR - no available links!', Status.error)));
        console.log('ERROR - no available links!');
        return;
    }
    res.json(JSON.stringify({ html: linksArray[linksArrayIndex] }));
    console.log(`${linksArray[linksArrayIndex]} sended. Index ${linksArrayIndex}`);
    linksArrayIndex++;
});

server.post('/register', (req, res) => {
    if (browsersArray.length == 0) {
        let tempObj = new BrowserTab(
            req.body.id,
            0,
            req.body.subid,
            Status.ready
        );
        console.log(
            `'${req.body.id}' with subid:'${tempObj.subid}' was created`
        );
        browsersArray.push(tempObj);
        let tempMsg = reportStatus(tempObj);
        tempMsg.message = `'${req.body.subid}' was created and ${
            tempMsg.message
        }`;
        console.log(tempMsg.message);
        res.json(JSON.stringify(tempMsg));
    } else {
        let tempObj = checkUser(req.body.subid, true);
        if (tempObj) {
            let tempMsg = reportStatus(tempObj);
            // res.status(400);
            tempMsg.message = `'${req.body.subid}' already exists and ${
                tempMsg.message
            }`;
            console.log(tempMsg.message);
            res.json(JSON.stringify(tempMsg));
        } else {
            let tempObj = new BrowserTab(
                req.body.id,
                browsersArray.length,
                req.body.subid
            );
            if (browsersArray[browsersArray.length - 1].code == Status.complete)
                tempObj.code = Status.ready;
            browsersArray.push(tempObj);
            let tempMsg = reportStatus(tempObj);
            tempMsg.message = `'${req.body.id}' with subid:${
                tempObj.subid
            } was created and ${tempMsg.message}`;
            console.log(tempMsg.message);
            res.json(JSON.stringify(tempMsg));
        }
    }
});

server.get('/list', (req, res) => {
    let ids: string[] = [];
    for (let i = 0; i < browsersArray.length; i++) {
        ids.push(`${reportStatus(browsersArray[i]).message}`);
    }
    console.log(ids);
    res.json(JSON.stringify(ids));
});

server.post('/status', (req, res) => {
    let tempObj = checkUser(req.body.subid, true);
    let tempMsg = reportStatus(tempObj);
    if (tempMsg) {
        console.log(tempMsg.message);
        res.json(JSON.stringify(tempMsg));
        return;
    }
    console.log(`SUBID ${req.body.subid} does not exist on this server`);
    // res.status(400);
    res.json(
        JSON.stringify(
            new ResponseMsg(
                `SUBID ${req.body.subid} does not exist on this server`,
                Status.error
            )
        )
    );
});

server.get('/alllinks', (req, res) => {
    console.log(linksArray);
    res.json(JSON.stringify(linksArray));
});

server.post('/statusupdate', (req, res) => {
    let tempObj = checkUser(req.body.subid, true);
    if (!tempObj) {
        console.log(`FATAL ERROR - SUBID '${req.body.subid}' DOES NOT EXIST`);
        return;
    }
    if (req.body.completed) {
    }
    tempObj.code = Status.complete;
    console.log(reportStatus(tempObj).message);
    childProcess.execSync(`echo "SUBID:${req.body.subid} downloaded" >> downloadedLog.txt`, { stdio: 'inherit' });
    if (browsersArray.length - 1 != tempObj.index) {
        browsersArray[tempObj.index + 1].code = Status.ready;
        console.log(reportStatus(browsersArray[tempObj.index + 1]).message);
    }
});

server.post('/videotags', (req, res) => {
    videotags.push(req.body.videotag);
    let tempObj = checkUser(req.body.subid, true);
    if (!tempObj) {
        console.log(`FATAL ERROR - SUBID '${req.body.subid}' DOES NOT EXIST`);
        return;
    }
    console.log(`received html ${tempObj.counter}`);
    let counterString: string;
    if (tempObj.counter < 10) counterString = `00${tempObj.counter + 1}`;
    else if (tempObj.counter < 100 && tempObj.counter >= 10)
        counterString = `0${tempObj.counter + 1}`;
    else counterString = `${tempObj.counter + 1}`;
    tempObj.code = Status.downloading;
    res.json(
        JSON.stringify(
            new ResponseMsg(
                'Now downloading ' + req.body.subid,
                Status.downloading
            )
        )
    );
    childProcess.execSync('rm -rvf createdHTMLs/*', {
        stdio: 'inherit',
        cwd: './'
    });
    fs.writeFileSync(`createdHTMLs/${counterString}.html`, req.body.videotag);
    childProcess.execSync('rm -rvf futureHTMLs/*', {
        stdio: 'inherit',
        cwd: '../megabot/'
    });
    childProcess.execSync(
        'cp -rv ../../megabotsorrizoronaldotron8000/createdHTMLs/*.* ./',
        { stdio: 'inherit', cwd: '../megabot/futureHTMLs' }
    );
    childProcess.execSync(
        `node js/server.js --downloadvideos ${tempObj.counter}`,
        { stdio: 'inherit', cwd: '../megabot/' }
    );
    // remove this childProcess.execSync for the script to work correctly
    // childProcess.execSync(
    //     `curl -o x.zip https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip`,
    //     { stdio: 'inherit', cwd: '../megabot/' }
    // );
    tempObj.code = Status.ready;
    tempObj.counter++;
});

server.get('/videotags', (req, res) => {
    res.json(JSON.stringify(videotags));
});

server.get('/test', (req, res) => {
    testType(new Number(25));
    testType(new String('iae'));
    testType(new BrowserTab('lulu', 0, null));
    testType(new ResponseMsg('ouuyt'));
    res.json(new ResponseMsg('working just fine'));
});
