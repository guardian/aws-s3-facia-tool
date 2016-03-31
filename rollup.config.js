import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

const nodeResolveConfig = {};

export default {
	entry: 'lib/facia-tool.js',
	format: 'cjs',
	dest: 'dist/bundle.js',
	external: ['aws-sdk'],
	plugins: [
		json(),
		nodeResolve(nodeResolveConfig),
		commonjs()
	]
};
