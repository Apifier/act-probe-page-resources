const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const _ = require('underscore');
const Apify = require('apify');
const typeCheck = require('type-check').typeCheck;


// Definition of the input
const INPUT_TYPE = `{
    urls: [String],
    waitSecs: Maybe Number,
    verboseLog: Maybe Boolean,
    headers: Maybe Object     
}`;


Apify.main(async () => {
    // Fetch and check the input
    const input = await Apify.getValue('INPUT');
    if (!typeCheck(INPUT_TYPE, input)) {
        console.log('Expected input:');
        console.log(INPUT_TYPE);
        console.log('Received input:');
        console.dir(input);
        throw new Error('Received invalid input');
    }

    // Launch Chrome
    const chrome = await launchChrome({
        headless: !!process.env.APIFY_HEADLESS,
        verboseLog: input.verboseLog
    });
    const client = await CDP({ port: chrome.port });

    let currentResult = null;

    // Extract domains
    const { Network, Page } = client;

    // Add HTTP headers
    if (input.headers) {
        await Network.setExtraHTTPHeaders({ headers: input.headers });
        if (input.headers['User-Agent']) await Network.setUserAgentOverride({ userAgent: input.headers['User-Agent'] });
    }

    // Setup event handlers
    await Network.requestWillBeSent((params) => {
        //console.log("### Network.requestWillBeSent");
        //console.dir(params);

        let req = currentResult.requests[params.requestId];
        if (!req) {
            req = currentResult.requests[params.requestId] = {};
            req.url = params.request.url;
            req.method = params.request.method;
            req.requestedAt = new Date(params.wallTime * 1000);
        } else {
            // On redirects, the Network.requestWillBeSent() is fired multiple times
            // with the same requestId and the subsequent requests contain the 'redirectResponse' field
            req.redirects = req.redirects || [];
            const redirect = _.pick(params.redirectResponse, 'url', 'status');
            redirect.location = params.redirectResponse && params.redirectResponse.headers ? params.redirectResponse.headers['location'] : null;
            req.redirects.push(redirect);
        }
    });

    await Network.responseReceived((params) => {
        //console.log("### Network.responseReceived");
        //console.dir(params);

        const req = currentResult.requests[params.requestId];
        req.status = params.response.status;
        req.mimeType = params.response.mimeType;
        req.type = params.type;
    });

    await Network.loadingFailed((params) => {
        //console.log("### Network.loadingFailed");
        //console.dir(params);

        // Note that request failures might come from the previous page
        const req = currentResult.requests[params.requestId];
        if (req) {
            req.type = params.type;
            req.errorText = params.errorText;
            req.canceled = params.canceled;
        }
    });

    // Enable events
    await Promise.all([Network.enable(), Page.enable()]);

    // Disable cache
    await Network.setCacheDisabled({ cacheDisabled: true });

    // Iterate and probe all URLs
    const results = [];
    for (let url of input.urls) {
        console.log(`Navigating to URL: ${url}`);
        currentResult = {
            url,
            requests: {}
        };
        results.push(currentResult);

        await Page.navigate({ url });
        await Page.loadEventFired();

        // Wait input.waitSecs seconds
        await new Promise((resolve) => setTimeout(resolve, input.waitSecs*1000 || 0));
        await Page.stopLoading();
    }

    // Save results
    await Apify.setValue('OUTPUT', results);

    // Only useful for local development
    await chrome.kill();

    console.log('Done');
});


// Code inspired by https://developers.google.com/web/updates/2017/04/headless-chrome
const launchChrome = async (options = {}) => {
    console.log('Launching Chrome...');
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
            options.headless ? '--disable-gpu' : '',
            options.headless ? '--headless' : '',
            '--no-sandbox',
        ],
        logLevel: options.verboseLog ? 'verbose' : 'error',
    });

    const version = await CDP.Version({port: chrome.port});
    console.log(`Chrome launched (pid: ${chrome.pid}, port: ${chrome.port}, userAgent: ${version['User-Agent']})`);

    return chrome;
};