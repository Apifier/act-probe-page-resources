const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');


const launchChrome = (headless=false) => {
    // Code inspired by https://developers.google.com/web/updates/2017/04/headless-chrome
    return chromeLauncher.launch({
        port: 9222,
        chromeFlags: [
            '--window-size=412,732',
            '--disable-gpu',
            headless ? '--headless' : ''
        ]
    });
};


launchChrome().then((chrome) => {
    return new Promise((resolve, reject) => {
        CDP((client) => {
            // extract domains
            const { Network, Page } = client;
            // setup handlers
            Network.requestWillBeSent((params) => {
                console.log("### Network.requestWillBeSent");
                console.dir(params);
                // console.log(params.request.url);
            });
            Network.responseReceived((params) => {
                console.log("### Network.responseReceived");
                console.dir(params);
                //console.log(params.requestId);
                //console.log(params.type);
            });
            Network.loadingFailed((params) => {
                console.log("### Network.loadingFailed");
                console.dir(params);
            });
            Page.loadEventFired(() => {
                client.close();
            });
            // enable events then start!
            Promise.all([
                Network.enable(),
                Page.enable(),
            ]).then(() => {
                return Page.navigate({ url: 'https://github.com' });
            }).catch((err) => {
                console.error(err);
                client.close();
                resolve();
            });
        }).on('error', (err) => {
            // cannot connect to the remote endpoint
            console.error(err);
            reject(err);
        });
    });
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});
