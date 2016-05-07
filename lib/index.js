'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function () {
	return {
		visitor: visitor
	};
};

var _babelTemplate = require('babel-template');

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var newPromiseLatency = 200;
var promiseCreateLatency = 100;

var newPromiseTemplate = (0, _babelTemplate2.default)('\n\tnew Promise(function(resolve, reject) {\t\t\n\t\tFUNCTION.call(this, a => setTimeout(() => resolve(a), ' + newPromiseLatency + '),\n\t\t                    a => setTimeout(() => reject(a), ' + newPromiseLatency + '))\n\t});\n');

var promiseCreateTemplate = (0, _babelTemplate2.default)('\n\tnew Promise((resolve, reject) => {\n\t\tFUNCTION(ARGUMENTS);\n\t});\n');

function getProbability(p) {
	return isNaN(p - p) ? .2 : p;
}

// WeakSet holding some AST nodes to avoid recursion
// probably better than assigning "private" property to the nodes
var skipNodes = new WeakSet();

var visitor = {
	BinaryExpression: function BinaryExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		switch (path.node.operator) {
			case '==':
				path.node.operator = '===';
				break;
			case '===':
				path.node.operator = '==';
				break;
			case '>':
				path.node.operator = '>=';
				break;
			case '<':
				path.node.operator = '<=';
				break;
			case '>=':
				path.node.operator = '>';
				break;
			case '<=':
				path.node.operator = '<';
				break;
			case '>>':
				path.node.operator = '>>>';
				break;
			case '>>>':
				path.node.operator = '>>';
				break;
			case 'instanceof':
				path.replaceWith(t.booleanLiteral(true));
				break;
		}
	},
	AssignmentExpression: function AssignmentExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		switch (path.node.operator) {
			case '>>=':
				path.node.operator = '>>>=';
				break;
			case '>>>=':
				path.node.operator = '>>=';
				break;
		}
	},
	UnaryExpression: function UnaryExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		switch (path.node.operator) {
			case 'typeof':
				path.replaceWith(t.stringLiteral('object'));
				break;
			case '+':
				path.replaceWith(path.node.argument);
				break;
			case 'delete':
				// avoid invalid lvalues (e.g. literals)
				if (path.node.argument.type === 'MemberExpression') {
					path.replaceWith(t.assignmentExpression('=', path.node.argument, t.identifier('undefined')));
				}
				break;
		}
	},
	NewExpression: function NewExpression(path, state) {

		if (skipNodes.has(path.node)) return;
		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'Promise') {
			var newNode = newPromiseTemplate({
				FUNCTION: 0 in path.node.arguments ? path.node.arguments[0] : t.identifier('undefined	')
			}).expression; // newPromiseTemplate returns ExpressionStatement but we are interested only in NewExpression

			skipNodes.add(newNode);
			path.replaceWith(newNode);
		} else {
			var callee = path.node.callee;
			var args = [t.objectExpression([])].concat(path.node.arguments);
			path.replaceWith(t.callExpression(t.memberExpression(callee, t.identifier('call')), args));
		}
	},
	UpdateExpression: function UpdateExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		path.node.prefix = !path.node.prefix;
	},
	MemberExpression: function MemberExpression(path, state) {

		if (skipNodes.has(path.node)) return;
		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		// detect lvalue - probably not very reliable but good enough
		if (!t.isAssignmentExpression(path.parentPath.node) && !t.isUpdateExpression(path.parentPath.node)) {
			if (path.node.computed === false && path.node.property.name === 'length') {
				skipNodes.add(path.node); // babel will try to retransform this node as it will be child of created node
				path.replaceWith(t.binaryExpression('+', path.node, t.numericLiteral(1)));
			}
		}
	},
	CallExpression: function CallExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if (Math.random() >= probability) return;

		if (t.isMemberExpression(path.node.callee) && path.node.callee.computed === false) {
			if (t.isIdentifier(path.node.callee.object) && path.node.callee.object.name === 'Promise') {
				if (path.node.callee.property.name === 'resolve' || path.node.callee.property.name === 'reject') {
					var node = promiseCreateTemplate({
						FUNCTION: path.node.callee.property,
						ARGUMENTS: path.node.arguments
					});
					path.replaceWith(node);
				}
			}
		}
	}
};