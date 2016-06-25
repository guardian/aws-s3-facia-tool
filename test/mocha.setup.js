require('babel-register')({
	plugins: 'babel-plugin-transform-es2015-modules-commonjs'
});
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
