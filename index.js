/*
    Copyright 2009-2011 Emilis Dambauskas

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Requirements:
var httpclient = require("ringo/httpclient");


exports.update_url = "http://localhost:8983/solr/update/json";
exports.search_url = "http://localhost:8983/solr/select/";
exports.commit_param = "commit=true";

/**
 *
 */
exports.connect = function(uri) {

    var url = uri.uri
        .replace(/solr:\/\//, "http://")
        .replace(/\/$/, "");
    this.update_url = url + "/update/json";
    this.search_url = url + "/select/";
    
    if (uri.params && uri.params.commit) {
        this.commit_param = uri.params.commit;
    }
};


/**
 *
 * @param {String|Number} id Document ID.
 */
exports.read = function(filter) {
    return this.list({id: filter}, {limit: 1})[0];
}


/**
 *
 */
exports.write = function(id, data) {

    if (this.serialize) {
        data = this.serialize(data);
    }

    var json = JSON.stringify([data]);

    var req = {
        method: "POST",
        url: this.update_url + '?' + this.commit_param,
        contentType: "application/json; charset=utf-8",
        data: json,
        };

    return httpclient.request(req);
}


/**
 *
 * @param {String|Arrary} id ID or array of IDs of documents to remove.
 */
exports.remove = function(id) {

    // Get a list of ids:
    if (typeof(id) == "string" || id instanceof String) {
        id = [id];
    }

    var command = '{"delete":{"id":'
        + id.map(JSON.stringify).join('},\n"delete":{"id":')
        + '}}';

    if (id.length) {
        var req = {
            method: "POST",
            url: this.update_url + '?' + this.commit_param,
            contentType: "application/json; charset=utf-8",
            data: command
        };

        return httpclient.request(req);
    } else {
        return true;
    }
}


/**
 *
 */
exports.iterate = function(query, options) {

    for each (var record in this.list(query, options)) {
        yield record;
    }
};


/**
 *
 */
exports.list = function(query, options) {

    query = query || "*:*";
    options = options || {};

    var params = {};
    params.wt = options.format || "json";
    params.rows = options.limit || 100;
    params.start = options.offset || 0;

    if (options.fields) {
        params.fl = options.fields.join(",");
    }
    if (options.highlight) {
        params.hl = "true";
        params["hl.fl"] = options.highlight.join(",");
    }

    if (options.order) {
        params.sort = "";
        var sep = "";
        for (var k in options.order) {
            if (options.order[k] == -1) {
                params.sort += sep + encodeURIComponent(k) + "+desc";
            } else if (options.order[k] == 1) {
                params.sort += sep + encodeURIComponent(k) + "+asc";
            }
            sep = ",";
        }
    }

    params.q = "";
    if (typeof(query) == "string" || query instanceof String) {
        params.q = encodeURIComponent(query);
    } else {
        var sep = "";
        for (var k in query) {
            var value = query[k];
            var enk = encodeURIComponent(k) + ":";

            if (value instanceof Date) {
                params.q += sep + enk + value.toISOString();
            } else if (typeof(value) == "string" || value instanceof String) {
                params.q += sep + enk + encodeURIComponent(value);
            } else if (value instanceof Array) {
                params.q += sep + "(" + enk + value.join(" OR " + enk) + ")";
            } else if (value.action == "range") {
                params.q += sep + enk + "[" + encodeURIComponent(value.from) + " TO " + encodeURIComponent(value.to) + "]";
            } else {
                throw Error("Unrecognized parameter '" + k + "' value '" + value + "'.");
            }

            sep = " AND ";
        }
    }

    var url = this.search_url;
    url += "?" + Object.keys(params).map(function(k) { return k + "=" + params[k]; }).join("&");

    var res = httpclient.get(url);
    if (res.status !== 200) {
        throw Error(module.id + ".list(): Solr server returned an error. Url: " + url);
    } else {
        if (options.format) {
            return res.content;
        } else {
            var content = JSON.parse(res.content);
            if (content && content.response && content.response.docs && content.response.docs.length) {
                var r = content.response;
                var h = content.highlighting;

                content = this.unserialize ? r.docs.map(this.unserialize) : r.docs;
                if (h) {
                    content = content.map(function(doc) { doc._highlight = h[doc.id]; return doc; });
                }

                // This should be added after all map() calls:
                Object.defineProperty(content, "numFound", {enumerable:false, value: r.numFound });

                return content;
            } else {
                return [];
            }
        }
    }
}


