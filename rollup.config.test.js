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
		babel(),
		istanbul({
			exclude: [
				'test/*.js',
				'node_modules/**/*',
				'**/visible-stories.js'
			],
			instrumenterConfig: {
				esModules: true,
				noCompact: true
			}
		}),
		nodeResolve({ jsnext: true }),
		commonjs()
	]
};
