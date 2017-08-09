# act-probe-page-resources

Apify act that sequentially loads a list of URLs in headless Chrome
and extracts a list of resources from each of them.

The act does not store its state, i.e. if it crashes it restarts fetching all URLs.
Therefore you should only use it for short lists of URLs.

**INPUT**

Input is a JSON object with the following properties:

```javascript
{
    // Array of URLs to open by the browser.
    urls: [String],

    // Indicates how to long should the browser stay on each page before loading the next URL
    timeoutSecs: Number,
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
