/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var htmlMinifier = require("html-minifier");
var attrParse = require("./lib/attributesParser");
var loaderUtils = require("loader-utils");
var url = require("url");
var assign = require("object-assign");
var compile = require("es6-templates").compile;

function randomIdent() {
	return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
}

function getLoaderConfig(context) {
	var query = loaderUtils.parseQuery(context.query);
	var configKey = query.config || 'htmlLoader';
	var config = context.options && context.options.hasOwnProperty(configKey) ? context.options[configKey] : {};

	delete query.config;

	return assign(query, config);
}

module.exports = function(content) {
	this.cacheable && this.cacheable();
	var config = getLoaderConfig(this);
	var attributes = ["img:src", "img:srcset"];
	if(config.attrs !== undefined) {
		if(typeof config.attrs === "string")
			attributes = config.attrs.split(" ");
		else if(Array.isArray(config.attrs))
			attributes = config.attrs;
		else if(config.attrs === false)
			attributes = [];
		else
			throw new Error("Invalid value to config parameter attrs");
	}
	var root = config.root;
	var links = attrParse(content, function(tag, attr) {
		return attributes.indexOf(tag + ":" + attr) >= 0;
	});
	links.reverse();
	var data = {};
	content = [content];
	links.forEach(function(link) {
		var newValue = link.value.split(",");
		var newValue = newValue.map(function (value) {
			var valueArray = value.trim().split(" ");
			var obj = {
				value: valueArray.shift(),
				additional: valueArray,
			};
			if(!loaderUtils.isUrlRequest(obj.value, root)) return;
			var uri = url.parse(obj.value);
			if (uri.hash !== null && uri.hash !== undefined) {
				obj.hash = uri.hash;
				uri.hash = null;
				obj.value = uri.format();
			}
			return obj;
		});

		do {
			var ident = randomIdent();
		} while(data[ident]);
		data[ident] = newValue;
		var x = content.pop();


		content.push(x.substr(link.start + link.length));
		content.push(ident);
		content.push(x.substr(0, link.start));
	});
	content.reverse();
	content = content.join("");
	if(typeof config.minimize === "boolean" ? config.minimize : this.minimize) {
		var minimizeOptions = assign({}, config);

		[
			"removeComments",
			"removeCommentsFromCDATA",
			"removeCDATASectionsFromCDATA",
			"collapseWhitespace",
			"conservativeCollapse",
			"removeAttributeQuotes",
			"useShortDoctype",
			"keepClosingSlash",
			"minifyJS",
			"minifyCSS",
			"removeScriptTypeAttributes",
			"removeStyleTypeAttributes",
		].forEach(function(name) {
			if(typeof minimizeOptions[name] === "undefined") {
				minimizeOptions[name] = true;
			}
		});

		content = htmlMinifier.minify(content, minimizeOptions);
	}

	if(config.interpolate) {
		content = compile('`' + content + '`').code;
	} else {
		content = JSON.stringify(content);
	}
	return "module.exports = " + content.replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, function(match) {
		if(!data[match]) return match;
		return data[match].reduce(function (pV,cV, index, array) {

			var hash = cV.hash || "";
			var additional = cV.additional.length != 0 ? " " + cV.additional.join(" ") : "";
			if (index != array.length -1) {
				additional += ",";
			}
			return pV + '" + require(' + JSON.stringify(loaderUtils.urlToRequest(cV.value, root)) + ') + "' + hash + additional;
		},"");
	}) + ";";
}
