const Assets = require('assets');
const path = require('path');

const PATHS = require('../../../paths');

const resolver = new Assets();

function InlineExtension() {
	this.tags = ['inline'];

	this.parse = function(parser, nodes) {
		// get the tag token
		var tok = parser.nextToken();

		var args = parser.parseSignature(null, true);
		parser.advanceAfterBlockEnd(tok.value);

		// See above for notes about CallExtension
		return new nodes.CallExtensionAsync(this, 'run', args);
	};

	this.run = function(context, url, callback) {
		const pathResolved = path.resolve(PATHS.src.imagesInline + url);
		resolver.data(pathResolved, callback);
	};
}

module.exports.inlineExtension = new InlineExtension();
