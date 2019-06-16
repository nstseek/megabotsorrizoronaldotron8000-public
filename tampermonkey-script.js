// ==UserScript==
// @name         Fetch null urls
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        null
// @grant        none
// ==/UserScript==

// PARA QUE ELE REDIRECIONE AUTOMATICAMENTE APOS EXTRAIR
// VOCE PRECISA DESCOMENTAR AS LINHAS QUE ALTERAM O WINDOW.LOCATION.HREF

// PARA RECEBER OS LOGS, TU PRECISA ABRIR O LOGSERVER

// PARA USAR O SETTIMEOUTSYNC, TU PRECISA USAR UMA ASYNC FUNCTION E O AWAIT

(function() {

    'use strict';

    let now;
    let mark;
    let delay;
    let markSaved = false;
    let callback;
    let procedure;

    let resolveFunc;
    let setTimeoutSyncProcedure;

    const setTimeoutSync = (callbackFunc, setDelay) => {
        delay = setDelay;
        callback = callbackFunc;
        setTimeoutSyncProcedure = (time) => {
            now = time;
            if (!markSaved) {
                mark = time;
                markSaved = true;
            }
            let timePassed = now - mark;
            if (timePassed < delay) {
                window.requestAnimationFrame(setTimeoutSyncProcedure);
            }
            else {
                callback();
                markSaved = false;
                resolveFunc(0);
            }
         
        }
        const setTimeoutCallback = (resolve, reject) => {
            resolveFunc = resolve;
            window.requestAnimationFrame(setTimeoutSyncProcedure);
        };
        return new Promise(setTimeoutCallback);
    }

    const setTimeout = (callbackPassed, delayPassed) => {
        callback = callbackPassed;
        delay = delayPassed;
        procedure = (time) => {
            now = time;
            if (!markSaved) {
                mark = time;
                markSaved = true;
            }
            let timePassed = now - mark;
            if (timePassed < delay) {
                window.requestAnimationFrame(procedure);
                return;
            }
            callback();
            markSaved = false;
        }
        window.requestAnimationFrame(procedure);
    }

    let state = {id : `unknown`};

    let pageLoaded = false;

    window.onload = () => {
        pageLoaded = true;
    };

    const consoleLog = (message) => {
        if(typeof message == "object") {
            message = `converted from obj: ${JSON.stringify(message)}`;
        }
        try {
            fetch(`http://localhost:7000/log`, {
            method: `POST`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: state.id, log: message})
        })
        }
        catch (error) {

        }

    }

    const getInfo = () => {
        let info = {
            id: document.querySelector('title').innerHTML,
            subid: window.location.href
        };
        let startIndex = 'null string'.length;
        let endIndex = info.subid.indexOf('/', startIndex + 1);
        if (endIndex == -1) info.subid = info.subid.slice(startIndex);
        else info.subid = info.subid.slice(startIndex, endIndex);
        consoleLog('subid: ' + info.subid);
        info.id = info.id.slice(0, info.id.indexOf(':'));
        consoleLog('ID: ' + info.id);
        return info;
    };

    state = getInfo();

    consoleLog(`Running extractor script - HAIL SORRIZO RONALDOTRON 8000`);

    const getPage = () => {
        if (document.querySelector(`video`) == null) {
            consoleLog(`n tem tag video aqui`);
            return getNextLink();
        }
        let videotag = {
            videotag: document.querySelector(`html`).outerHTML,
            subid: state.subid
        };
        return videotag;
    };

    const sendPage = () => {
        consoleLog(`Timeout done - ${delay / 1000}s`);        
        consoleLog(`Downloading page...`);

        fetch(`http://localhost:8000/videotags`, {
            method: `POST`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(page)
        })
            .then(response => response.json())
            .then(data => {consoleLog(data.toString())})
            .then(() => {
                consoleLog('waiting for permission to go to next page...');
                checkStatusRedirect();
            });
    };

    const getNextPage = () => {
        consoleLog('getting next page');
        let HTMLpage = document.querySelector(`html`).outerHTML;
        let startingIndex = HTMLpage.search(
            /<select class="task-menu-sections-select" onchange="location.href='\/course\/(.*)/
        );
        HTMLpage = HTMLpage.slice(startingIndex);
        startingIndex = HTMLpage.search(/<option value="(.*)" selected="">/);
        if (startingIndex == -1) {
            consoleLog(`FATAL ERROR - COULD NOT FIND PAGE SELECTOR`);
            return null;
        }
        HTMLpage = HTMLpage.slice(startingIndex);
        startingIndex = HTMLpage.indexOf(`value="`) + `value="`.length;
        let endingIndex = HTMLpage.indexOf('"', startingIndex);
        HTMLpage = HTMLpage.slice(startingIndex, endingIndex);
        consoleLog(`HTMLpage: ${HTMLpage}`);
        let actualPage = parseInt(HTMLpage);
        let optionsArray = document.querySelectorAll('body > section > aside > section.task-menu-sections > select > option');
        if(!((actualPage+1) <= optionsArray.length)) {
            consoleLog(`This is the last page available, returning null...`);
            return null;
        }
        let actualHTML = window.location.href;
        consoleLog(actualHTML);
        actualHTML = actualHTML.match(
            /null/
        );
        actualHTML = actualHTML[0];
        let endingHTMLIndex = actualHTML.indexOf(`task`);
        actualHTML = actualHTML.slice(0, endingHTMLIndex);
        consoleLog(`actualHTML: ${actualHTML}`);
        let changePageString = `${actualHTML}section/${actualPage + 1}`;
        consoleLog(`changePageString: ${changePageString}`);
        return changePageString;
    };

    const getNextCourse = async() => {
        let serverResponse = await fetch(`http://localhost:8000/link`, {
            method: `GET`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        serverResponse = await serverResponse.json();
        serverResponse = await JSON.parse(serverResponse);
        await consoleLog(serverResponse);
        if(serverResponse.html) {
            consoleLog('Redirecting to next course: ' + serverResponse.html);
            window.location.href = serverResponse.html;
        }
        else {
            consoleLog("ERROR - server didn't send any link");
            throw new Error();
        }
        return;
    };

    const redirectToNextPage = async(delayLink, link) => {
        setTimeout( () => {
            window.location.href = link;
        }, delayLink);
        consoleLog("redirecting in (delayLink): " + delayLink + "ms");
        
        try {
            if (document.querySelector(`#video-player-frame > div.vjs-poster`)) {
                consoleLog('video tag was found');
                document.querySelector(`#video-player-frame > div.vjs-poster`).click();
                consoleLog(`Video clicked`);
                await setTimeoutSync(() => {
                    consoleLog('2 secs passed, can click pause now');
                }, 2000)
                await setTimeoutSync(() => { 
                    if (document.querySelector(`#video-player-frame > div.vjs-control-bar > div.vjs-play-control.vjs-control.vjs-playing`)) {
                        document.querySelector(`#video-player-frame > div.vjs-control-bar > div.vjs-play-control.vjs-control.vjs-playing`).click();
                        consoleLog(`Video paused`);
                    }
                    else {
                        consoleLog('could not find pause');
                    }
                }, 2000);
                await setTimeoutSync(() => { 
                    window.stop(); 
                    consoleLog(`Page stopped`);
                }, 2000);
            }
            else {
                consoleLog('video tag was not found');
            }    
        } catch (error) {
            setTimeout( () => {
                window.location.href = link;
            }, delayLink);
            consoleLog("redirecting in (delayLink): " + delayLink + "ms");
            consoleLog('ERRORS HAPPENED WHILE CLICKING VIDEO' + error);
        }
        setTimeout( () => {
            window.location.href = link;
        }, delayLink);
        consoleLog("redirecting in (delayLink): " + delayLink + "ms");
        return;
    };

    const getNextLink = () => {
        consoleLog('getting next link');
        let HTMLpage = document.querySelector(`html`).outerHTML;
        let startingIndex = HTMLpage.indexOf(
            `<li class="task-menu-nav-item task-menu-nav-item--selected">`
        );
        startingIndex =
            startingIndex +
            `<li class="task-menu-nav-item task-menu-nav-item--selected">`
                .length;
        HTMLpage = HTMLpage.slice(startingIndex);
        startingIndex = HTMLpage.indexOf(`</a>`);
        HTMLpage = HTMLpage.slice(startingIndex);
        startingIndex = HTMLpage.search(
            /<a href="(.*)" class="task-menu-nav-item-link task-menu-nav-item-link-VIDEO">/
        );
        if (startingIndex == -1) {
            consoleLog(`end of the page reached out - no more video options`);
            let getNextPageLink = getNextPage();
            if (getNextPageLink == null) {
                consoleLog('FATAL ERROR - NEXT LINK IS NULL');
                consoleLog('SENDING FINISHED STATUS...');
                postStatus();
                setTimeout(getNextCourse, delay);
                return;
            }
            consoleLog('redirecting to ' + getNextPageLink);
            let redirectDelaygetNextPageLink = (((Math.random()*1000)%30)*1000)/1;
            redirectDelaygetNextPageLink = redirectDelaygetNextPageLink - redirectDelaygetNextPageLink%1;
            while(redirectDelaygetNextPageLink < 15000) {
                redirectDelaygetNextPageLink = (((Math.random()*1000)%30)*1000)/1;
                redirectDelaygetNextPageLink = redirectDelaygetNextPageLink - redirectDelaygetNextPageLink%1;
            }
            redirectToNextPage(redirectDelaygetNextPageLink, getNextPageLink);
            return;
        }
        HTMLpage = HTMLpage.slice(startingIndex);
        startingIndex = HTMLpage.indexOf('href="') + 'href="'.length;
        let endingIndex = HTMLpage.indexOf('"', startingIndex + 1);
        HTMLpage = HTMLpage.slice(startingIndex, endingIndex);
        let HTMLpagebuf = HTMLpage.slice(0, 7);
        if (HTMLpagebuf == `/course`) {
            HTMLpage = `null`;
        }
        consoleLog(`HTMLpage: ${HTMLpage}`);
        consoleLog('redirecting to ' + HTMLpage);
        let redirectDelayHTMLpage = (((Math.random()*1000)%30)*1000)/1;
            redirectDelayHTMLpage = redirectDelayHTMLpage - redirectDelayHTMLpage%1;
            while(redirectDelayHTMLpage < 15000) {
                redirectDelayHTMLpage = (((Math.random()*1000)%30)*1000)/1;
                redirectDelayHTMLpage = redirectDelayHTMLpage - redirectDelayHTMLpage%1;
            }
            redirectToNextPage(redirectDelayHTMLpage, HTMLpage);
            return;
    };

    const register = async () => {
        let serverResponse = await fetch(`http://localhost:8000/register`, {
            method: `POST`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getInfo())
        });
        serverResponse = await serverResponse.json();
        serverResponse = await JSON.parse(serverResponse);
        consoleLog(serverResponse);
        return serverResponse;
    };

    const checkStatus = async () => {
        let serverResponse = await fetch(`http://localhost:8000/status`, {
            method: `POST`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        serverResponse = await serverResponse.json();
        serverResponse = await JSON.parse(serverResponse);
        await consoleLog(serverResponse);
        return await serverResponse;
    };

    const checkStatusRedirect = async () => {
        try {
            let serverResponse = await fetch(`http://localhost:8000/status`, {
                method: `POST`,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(state)
            });
            serverResponse = await serverResponse.json();
            serverResponse = await JSON.parse(serverResponse);
            await consoleLog(serverResponse);
            response = serverResponse;
            if (response.code != 1) {
                setTimeout(checkStatusRedirect, delay);
            } else {
                consoleLog('going to next page');
                getNextLink();
            }
        } catch (error) {
            consoleLog(error);
            setTimeout(checkStatusRedirect, delay);
        }
        return;
    };

    const postStatus = async () => {
        let serverResponse = await fetch(`http://localhost:8000/statusupdate`, {
            method: `POST`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: state.id,
                subid: state.subid,
                completed: true
            })
        });
        consoleLog(serverResponse);
        serverResponse = await serverResponse.json();
        serverResponse = await JSON.parse(serverResponse);
        await consoleLog(serverResponse);
    };

    const createDelay = () => {
        let delay = (Math.random() * 1000) % 45;
        let counter = 0;
        consoleLog(`delay gen-iteration ${counter}`);
        while (delay < 20) {
            consoleLog(`delay gen-iteration ${counter+1}`);
            delay = (Math.random() * 1000) % 45;
            counter++;
            if(counter >= 5) {
                delay = 47;
                break;
            }
        }
        delay = delay - (delay % 1);
        delay = delay * 1000;
        return delay;
    };

    delay = createDelay();

    let response;

    const recheckDelay = 30000;
    
    const waitForApproval = () => {
        consoleLog('Waiting for permission to download...');
        setTimeout(async() => {
            response = await checkStatus();
            if (response.code != 1) {
                consoleLog(`Request was denied, trying again in ${recheckDelay/1000}s`);
                waitForApproval();
            }
            else {
                consoleLog('Permission granted. Calling main...');
                page
                main(page);
            }
        }, recheckDelay);
    }
    
    const main = async () => {
        try {
            response = await checkStatus();
            if (response.code == 4) {
                state = await register();
                state.id = getInfo().id;
                state.subid = getInfo().subid;
                response = await state;
                consoleLog(state);
            }
            if (response.code != 1) {
                waitForApproval();
                return;
            } else {
                await sendPage();
            }
        } catch (error) {
            consoleLog(error);
            setTimeout(main, delay);
        }
    };

    let page;

    const mainFunc = () => {
        consoleLog(`Timeout set - ${delay / 1000}s`);
        setTimeout(async () => {
            consoleLog(`Timeout done - ${delay / 1000}s`);
            if (!pageLoaded) {
                consoleLog(`Page did not load - pageLoaded = ${pageLoaded}\nReloading...`);
                window.location.reload();
            }
            page = getPage();
            if (page == null) {
                return;
            }
            main(page);
        }, delay);
        delay = 10000;
    };

    mainFunc();
})();
