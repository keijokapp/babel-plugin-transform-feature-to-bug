import template from 'babel-template';
import * as t from 'babel-types';

const newPromiseLatency = 200;
const promiseCreateLatency = 100;

const newPromiseTemplate = template(`
	new Promise(function(resolve, reject) {		
		FUNCTION.call(this, a => setTimeout(() => resolve(a), ${newPromiseLatency}),
		                    a => setTimeout(() => reject(a), ${newPromiseLatency}))
	});
`);

const promiseCreateTemplate = template(`
	new Promise((resolve, reject) => {
		FUNCTION(ARGUMENTS);
	});
`);


function getProbability(p) {
	return isNaN(p - p) ? .2 : p;
}

// WeakSet holding some AST nodes to avoid recursion
// probably better than assigning "private" property to the nodes
var skipNodes = new WeakSet;

let visitor = {
	BinaryExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;
	
		switch(path.node.operator) {
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

	AssignmentExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;

		switch(path.node.operator) {
		case '>>=':
			path.node.operator = '>>>=';
			break;
		case '>>>=':
			path.node.operator = '>>=';
			break;
		}
	},

	UnaryExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;
		
		switch(path.node.operator) {
		case 'typeof':
			path.replaceWith(t.stringLiteral('object'));
			break;
		case '+':
			path.replaceWith(path.node.argument);
			break;
		case 'delete':
			// avoid invalid lvalues (e.g. literals)
			if(path.node.argument.type === 'MemberExpression') {
				path.replaceWith(t.assignmentExpression('=', path.node.argument, t.identifier('undefined')))
			}
			break;
		}
	},
	
	NewExpression(path, state) {
	
		if(skipNodes.has(path.node)) return;
		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;
	
		if(t.isIdentifier(path.node.callee) && path.node.callee.name === 'Promise') {
			let newNode = newPromiseTemplate({
				FUNCTION: 0 in path.node.arguments ? path.node.arguments[0] : t.identifier('undefined	')
			}).expression; // newPromiseTemplate returns ExpressionStatement but we are interested only in NewExpression

			skipNodes.add(newNode);
			path.replaceWith(newNode);
		} else {
			var callee = path.node.callee;
			var args = [ t.objectExpression([]) ].concat(path.node.arguments);
			path.replaceWith(t.callExpression(t.memberExpression(callee, t.identifier('call')), args));
		}		
	},
	
	UpdateExpression(path, state) {
	
		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;
	
		path.node.prefix = !path.node.prefix;
	},
	
	MemberExpression(path, state) {
	
		if(skipNodes.has(path.node)) return;
		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;
	
		// detect lvalue - probably not very reliable but good enough
		if(!t.isAssignmentExpression(path.parentPath.node) && !t.isUpdateExpression(path.parentPath.node)) {
			if(path.node.computed === false && path.node.property.name === 'length') {
				skipNodes.add(path.node); // babel will try to retransform this node as it will be child of created node
				path.replaceWith(t.binaryExpression('+', path.node, t.numericLiteral(1)))
			}
		}	
	},
	
	CallExpression(path, state) {

		var probability = getProbability(state.opts.probability);
		if(Math.random() >= probability) return;

		if(t.isMemberExpression(path.node.callee) && path.node.callee.computed === false) {
			if(t.isIdentifier(path.node.callee.object) && path.node.callee.object.name === 'Promise') {
				if(path.node.callee.property.name === 'resolve' || path.node.callee.property.name === 'reject') {
					var node = promiseCreateTemplate({
						FUNCTION: path.node.callee.property,
						ARGUMENTS: path.node.arguments
					});
					path.replaceWith(node);
				}
			}
		}

	}
}

export default function() {
	return {
		visitor: visitor
	};
}
