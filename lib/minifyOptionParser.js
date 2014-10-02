/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Taketoshi Aono @brn
*/


function convertFlags(flagStr) {
  return flagStr === 'true';
}



module.exports = function(query) {
  var opts = {
    removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: true,
		removeRedundantAttributes: true,
		useShortDoctype: true,
		removeEmptyAttributes: true,
		removeOptionalTags: true
  };

  if (query.minify) {
    var minifyOpts = query.minify.split(" ");
    var opt;
    for (var i = 0, len = minifyOpts.length; i < len; i++) {
      opt = minifyOpts[i].split(':');
      if (opt.length === 2) {
        opts[opt[0]] = convertFlags(opt[1]);
      }
    }
  }
  return opts;
};
