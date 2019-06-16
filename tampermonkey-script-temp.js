// ==UserScript==
// @name         Test setTimeoutSync
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.google.com/
// @grant        none
// ==/UserScript==


(function() {

    'use strict';

    let resolveFunc;
    let mark;
    let now;
    let delay;
    let callback;
    let setTimeoutSyncProcedure;
    let alreadySaved = false;

    const setTimeoutSync = (callbackFunc, setDelay) => {
        delay = setDelay;
        callback = callbackFunc;
        setTimeoutSyncProcedure = (time) => {
            now = time;
            if (!alreadySaved) {
                mark = time;
                alreadySaved = true;
            }
            let timePassed = now - mark;
            if (timePassed < delay) {
                window.requestAnimationFrame(setTimeoutSyncProcedure);
            }
            else {
                callback();
                resolveFunc(0);
            }
         
        }
        const setTimeoutCallback = (resolve, reject) => {
            resolveFunc = resolve;
            window.requestAnimationFrame(setTimeoutSyncProcedure);
        };
        return new Promise(setTimeoutCallback);
    }

    const main = async() => {
        await setTimeoutSync(() => {
            console.log("5 seconds passed. I'm free now.");
        }, 5000);
    
        console.log('iae bichao');
        console.log('qvs loco');
    };

    main();
    
})();