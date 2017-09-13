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

    // Indicates how to long should the browser wait for pending resources after page has been loaded.
    // By default it is 0.
    waitSecs: Number,

    // If set to true, Chrome prints verbose log.
    // By default false.
    verboseLog: Boolean,

    // Optional HTTP headers to use for all requests
    headers: Object,
}
```

**OUTPUT**

Output is a JSON object such as:

```javascript
[
  {
    "url": "https://www.apifier.com",
    "requests": {
      "72.1": {
        "url": "https://www.apifier.com/",
        "method": "GET",
        "requestedAt": "2017-08-10T13:40:39.184Z",
        "status": 200,
        "mimeType": "text/html",
        "type": "Document"
      },
      "72.2": {
        "url": "https://cdn.apifier.com/964599760cfc4cc23be6a889c9d825f885cf6af6.css?meteor_css_resource=true",
        "method": "GET",
        "requestedAt": "2017-08-10T13:40:39.233Z",
        "status": 200,
        "mimeType": "text/css",
        "type": "Stylesheet"
      },
      "72.27": {
        "url": "https://widget.intercom.io/widget/kod1r788",
        "method": "GET",
        "requestedAt": "2017-08-10T13:40:40.135Z",
        "redirects": [
          {
            "url": "https://widget.intercom.io/widget/kod1r788",
            "status": 302,
            "location": "https://js.intercomcdn.com/shim.585a31ca.js"
          }
        ],
        "status": 200,
        "mimeType": "application/javascript",
        "type": "Script"
      }
    }
  }
]
```
