# OFS-Solr

ObjectFS storage wrapper for Apache Solr.

## Usage

### Example

```javascript
// Find all documents matching "term":
var solr = require("ofs-solr");

feeds.connect({scheme:"solr",uri:"solr://localhost:8983/solr/"});

for each (var doc in solr.iterate("term")) {
    print("Matching document:", uneval(doc));
}
```

### API summary

#### ofs-solr

<table><tbody>
<tr><td align="right">void</td>
    <td><b>connect</b> (URI)</td>
    <td>Configures module instance for specific Solr server.</td></tr>
<tr><td align="right">Object</td>
    <td><b>read</b> (ID)</td>
    <td>Read one document from Solr server.</td></tr>
<tr><td align="right">void</td>
    <td><b>write</b> (ID, record)</td>
    <td>Save one record on Solr server.</td></tr>
<tr><td align="right">void</td>
    <td><b>remove</b> (ID)</td>
    <td>Remove one document on Solr server.</td></tr>
<tr><td align="right"><a href="https://developer.mozilla.org/en/JavaScript/Guide/Iterators_and_Generators">Iterator</a></td>
    <td nowrap="nowrap"><b>iterate</b> (filter, options)</td>
    <td>A generator function that returns an iterator over all documents matching filter.</td></tr>
<tr><td align="right">Array</td>
    <td><b>list</b> (filter, options)</td>
    <td>Returns an Array of documents matching the filter.</td></tr>
</tbody></table>


### Requirements

- [RingoJS](http://ringojs.org/) v0.8

## About

### License

This is free software, and you are welcome to redistribute it under certain conditions; see LICENSE.txt for details.

### Author contact

Emilis Dambauskas <emilis.d@gmail.com>, <http://emilis.github.com/>



