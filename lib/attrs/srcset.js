var SRCSET_REGEXP = /(\s+(\d+w))?(\s+(\d+x))?\s*$/;

function split(start, value) {
	var matches = [];

	// allow to load several urls in srcsets, separated by commas
	var subMatches = value.split(/,/);

	for(var i = 0; i < subMatches.length; ++i) {
		var subMatch = {
			start: start,
			value: subMatches[i],
			length: subMatches[i].length
		};
		// save position of the next match
		var next = start + subMatch.length + 1;

		// remove initial spacing
		var space = /^\s+/.exec(subMatch.value);
		if(space) {
			subMatch.value = subMatch.value.substr(space[0].length)
		}

		// remove srcset qualifiers (2x, 110w, etc.) at the end
		var qualifier = SRCSET_REGEXP.exec(subMatch.value);
		if(qualifier) {
			var qualifierLength = qualifier[0].length;
			subMatch.length -= qualifierLength;
			subMatch.value = subMatch.value.substr(0, subMatch.value.length - qualifierLength);
		}

		matches.push(subMatch);
		start = next;
	}

	return matches;
}

module.exports = {
	split: split
};
