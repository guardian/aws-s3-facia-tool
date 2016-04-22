import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

const nodeResolveConfig = {};

export default {
	entry: 'lib/facia-tool.js',
	format: 'cjs',
	dest: 'dist/bundle.js',
	external: ['aws-sdk'],
	plugins: [
		json(),
		babel(),
		nodeResolve(nodeResolveConfig),
		commonjs()
	]
};
