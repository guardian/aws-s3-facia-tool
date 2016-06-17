import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'lib/facia-tool.js',
	format: 'es6',
	dest: 'dist/bundle.es6.js',
	external: ['aws-sdk'],
	plugins: [
		json(),
		babel(),
		nodeResolve(),
		commonjs()
	]
};
