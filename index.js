var htmlMinifier = require('html-minifier'),
    attrParse = require('./lib/attributesParser'),
    loaderUtils = require('loader-utils'),
    url = require('url'),
    randomIdent;

randomIdent = function () {
    var id = ++randomIdent.id;

    return '___HTML_LINK___' + id + '___';
};

randomIdent.id = 0;

module.exports = function (content) {
    var query = loaderUtils.parseQuery(this.query),
        attributes = ['img:src'],
        root,
        links,
        data,
        minimize;

    if (this.cacheable) {
        this.cacheable();
    }

    if (query.attrs !== undefined) {
        if (typeof query.attrs === 'string') {
            attributes = query.attrs.split(' ');
        } else if (Array.isArray(query.attrs)) {
            attributes = query.attrs;
        } else if (query.attrs === false) {
            attributes = [];
        } else {
            throw new Error('Invalid value to query parameter attrs');
        }
    }
    root = query.root;
    links = attrParse(content, function (tag, attr) {
        return attributes.indexOf(tag + ':' + attr) >= 0;
    });
    links.reverse();
    data = {};
    content = [content];

    links.forEach(function (link) {
        var uri,
            x,
            ident;

        if (!loaderUtils.isUrlRequest(link.value, root)) {
            return;
        }

        uri = url.parse(link.value);

        if (uri.hash !== null && uri.hash !== undefined) {
            uri.hash = null;
            link.value = uri.format();
            link.length = link.value.length;
        }

        do {
            ident = randomIdent();
        } while (data[ident]);

        data[ident] = link.value;

        x = content.pop();

        content.push(x.substr(link.start + link.length));
        content.push(ident);
        content.push(x.substr(0, link.start));
    });

    content.reverse();
    content = content.join('');

    if (typeof query.minimize === 'boolean') {
        minimize = query.minimize;
    } else {
        // @see // --optimize-minimize
        minimize = this.minimize;
    }

    if (minimize) {
        content = htmlMinifier.minify(content, {
            removeComments: query.removeComments !== false,
            collapseWhitespace: query.collapseWhitespace !== false,
            collapseBooleanAttributes: query.collapseBooleanAttributes !== false,
            removeAttributeQuotes: query.removeAttributeQuotes !== false,
            removeRedundantAttributes: query.removeRedundantAttributes !== false,
            useShortDoctype: query.useShortDoctype !== false,
            removeEmptyAttributes: query.removeEmptyAttributes !== false,
            removeOptionalTags: query.removeOptionalTags !== false
        });
    }

    content = JSON.stringify(content);

    content = content.replace(/___HTML_LINK___[0-9\.]+___/g, function (match) {
        if (!data[match]) {
            throw new Error('HTML link cannot be resolved.');
        }

        return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
    });

    return 'module.exports = ' + content + ';';
};
