const htmlmin = require('html-minifier-next');
const util = require('util');
const { EleventyI18nPlugin } = require("@11ty/eleventy");
require('dotenv').config();

function eleventyConfig(config) {
	// Passthroughs
	config.addPassthroughCopy("src/img");
	config.addPassthroughCopy("src/scripts");
	config.addPassthroughCopy("src/data");
	config.addPassthroughCopy("src/css");
	
	config.addGlobalData('env', process.env);

	// Watch for changes
	config.addWatchTarget('css');

	// Layout aliases
	config.addLayoutAlias("base", "layouts/base.njk");

	// Minify HTML
	const isProduction = process.env.ELEVENTY_ENV === "production";

	var htmlMinify = function(value, outputPath) {
		if (outputPath && outputPath.indexOf('.html') > -1) {
			return htmlmin.minify(value, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
				minifyCSS: true
			});
		}
	}

	// html min only in production
	if (isProduction) {
		config.addTransform("htmlmin", htmlMinify);
	}

	// Configuration
	return {
		dir: {
			input: "src",
			output: "_site",
			includes: "includes",
			data: "data",
		},
		templateFormats: ["html", "njk", "md", "11ty.js"],
		htmlTemplateEngine: "njk",
		markdownTemplateEngine: "njk",
	};
};

module.exports = eleventyConfig;
