import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import istanbul from 'rollup-plugin-istanbul';

export default {
	entry: 'lib/index.js',
	format: 'cjs',
	dest: 'tmp/bundle.test.js',
	external: ['aws-sdk'],
	plugins: [
		json(),
		babel({
			include: 'node_modules/async-es/**/*.js'
		}),
		istanbul({
			exclude: ['test/*.js', 'node_modules/**/*']
		}),
		nodeResolve({ jsnext: true }),
		commonjs()
	]
};
