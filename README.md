# act-probe-page-resources

Apify act that sequentially loads a list of URLs in headless Chrome
and analyzes HTTP resources requested by each page.

The act does not store its state, i.e. if it crashes it restarts fetching all URLs.
Therefore you should only use it for short lists of URLs.

The implementation uses Chrome Debug Protocol rather than Selenium. See the following resources
for more details:

* https://chromedevtools.github.io/devtools-protocol/
* https://github.com/cyrus-and/chrome-remote-interface/wiki
* https://developers.google.com/web/updates/2017/04/headless-chrome


**INPUT**

Input is a JSON object with the following properties:

```javascript
{
    // Array of URLs to open by the browser.
    urls: [String],

    // Indicates how to long should the browser wait for pending resources after page has been loaded
    waitSecs: Number,
}
```

**OUTPUT**

Output is a JSON object such as:

```javascript
{
    pages: [
      {}
    ]
}
```
