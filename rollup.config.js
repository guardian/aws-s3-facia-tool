import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'lib/index.js',
	format: 'cjs',
	dest: 'dist/bundle.js',
	external: ['aws-sdk'],
	plugins: [
		json(),
		babel(),
		nodeResolve({ jsnext: true }),
		commonjs()
	]
};
