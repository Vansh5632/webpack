const rootPath = "../../../../";
const webpack = require(rootPath);
const path = require("path");

module.exports = (env, { testPath }) => ({
	plugins: [
		new webpack.debug.ProfilingPlugin({
			outputPath: path.join(testPath, "in/directory/events.json")
		})
	],
	node: {
		__dirname: false,
		__filename: false
	}
});
