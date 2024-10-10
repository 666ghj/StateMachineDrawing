/*
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

// draw using this instead of a canvas and call toLaTeX() afterward

var selectionStart = null;
var selectionEnd = null;
var selectedNodes = [];
var movingMultipleNodes = false;  // 追踪是否正在移动多个节点
var selectedNodes = [];
var selectedLinks = [];  // 记录被选中的连接线


function ExportAsLaTeX() {
	this._points = [];
	this._texData = '';
	this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

	this.toLaTeX = function() {
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.2]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this._texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x *= this._scale;
		y *= this._scale;
		radius *= this._scale;
		if(endAngle - startAngle == Math.PI * 2) {
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			// TikZ needs the angles to be in between -2pi and 2pi or it breaks
			if(Math.min(startAngle, endAngle) < -2*Math.PI) {
				startAngle += 2*Math.PI;
				endAngle += 2*Math.PI;
			} else if(Math.max(startAngle, endAngle) > 2*Math.PI) {
				startAngle -= 2*Math.PI;
				endAngle -= 2*Math.PI;
			}
			startAngle = -startAngle;
			endAngle = -endAngle;
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._texData += '\\draw [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._texData += '\\fill [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.advancedFillText = function(text, originalText, x, y, angleOrNull) {
		if(text.replace(' ', '').length > 0) {
			var nodeParams = '';
			// x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
			if(angleOrNull != null) {
				var width = this.measureText(text).width;
				var dx = Math.cos(angleOrNull);
				var dy = Math.sin(angleOrNull);
				if(Math.abs(dx) > Math.abs(dy)) {
					if(dx > 0) nodeParams = '[right] ', x -= width / 2;
					else nodeParams = '[left] ', x += width / 2;
				} else {
					if(dy > 0) nodeParams = '[below] ', y -= 10;
					else nodeParams = '[above] ', y += 10;
				}
			}
			x *= this._scale;
			y *= this._scale;
			this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/ /g, '\\mbox{ }') + '$};\n';
		}
	};

	this.translate = this.save = this.restore = this.clearRect = function(){};
}

// draw using this instead of a canvas and call toSVG() afterward
function ExportAsSVG() {
	this.fillStyle = 'black';
	this.strokeStyle = 'black';
	this.lineWidth = 1;
	this.font = '12px Arial, sans-serif';
	this._points = [];
	this._svgData = '';
	this._transX = 0;
	this._transY = 0;

	this.toSVG = function() {
		return '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' + this._svgData + '</svg>\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x += this._transX;
		y += this._transY;
		var style = 'stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" fill="none"';

		if(endAngle - startAngle == Math.PI * 2) {
			this._svgData += '\t<ellipse ' + style + ' cx="' + fixed(x, 3) + '" cy="' + fixed(y, 3) + '" rx="' + fixed(radius, 3) + '" ry="' + fixed(radius, 3) + '"/>\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}

			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}

			var startX = x + radius * Math.cos(startAngle);
			var startY = y + radius * Math.sin(startAngle);
			var endX = x + radius * Math.cos(endAngle);
			var endY = y + radius * Math.sin(endAngle);
			var useGreaterThan180 = (Math.abs(endAngle - startAngle) > Math.PI);
			var goInPositiveDirection = 1;

			this._svgData += '\t<path ' + style + ' d="';
			this._svgData += 'M ' + fixed(startX, 3) + ',' + fixed(startY, 3) + ' '; // startPoint(startX, startY)
			this._svgData += 'A ' + fixed(radius, 3) + ',' + fixed(radius, 3) + ' '; // radii(radius, radius)
			this._svgData += '0 '; // value of 0 means perfect circle, others mean ellipse
			this._svgData += +useGreaterThan180 + ' ';
			this._svgData += +goInPositiveDirection + ' ';
			this._svgData += fixed(endX, 3) + ',' + fixed(endY, 3); // endPoint(endX, endY)
			this._svgData += '"/>\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon fill="' + this.fillStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.fillText = function(text, x, y) {
		x += this._transX;
		y += this._transY;
		if(text.replace(' ', '').length > 0) {
			this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + textToXML(text) + '</text>\n';
		}
	};
	this.translate = function(x, y) {
		this._transX = x;
		this._transY = y;
	};

	this.save = this.restore = this.clearRect = function(){};
}

function StartLink(node, start) {
	this.node = node;
	this.deltaX = 0;
	this.deltaY = 0;
	this.text = '';

	if(start) {
		this.setAnchorPoint(start.x, start.y);
	}
}

StartLink.prototype.setAnchorPoint = function(x, y) {
	this.deltaX = x - this.node.x;
	this.deltaY = y - this.node.y;

	if(Math.abs(this.deltaX) < snapToPadding) {
		this.deltaX = 0;
	}

	if(Math.abs(this.deltaY) < snapToPadding) {
		this.deltaY = 0;
	}
};

StartLink.prototype.getEndPoints = function() {
	var startX = this.node.x + this.deltaX;
	var startY = this.node.y + this.deltaY;
	var end = this.node.closestPointOnCircle(startX, startY);
	return {
		'startX': startX,
		'startY': startY,
		'endX': end.x,
		'endY': end.y,
	};
};

StartLink.prototype.draw = function(c) {
	var stuff = this.getEndPoints();

	// draw the line
	c.beginPath();
	c.moveTo(stuff.startX, stuff.startY);
	c.lineTo(stuff.endX, stuff.endY);
	c.stroke();

	// draw the text at the end without the arrow
	var textAngle = Math.atan2(stuff.startY - stuff.endY, stuff.startX - stuff.endX);
	drawText(c, this.text, stuff.startX, stuff.startY, textAngle, selectedObject == this);

	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPoints();
	var dx = stuff.endX - stuff.startX;
	var dy = stuff.endY - stuff.startY;
	var length = Math.sqrt(dx*dx + dy*dy);
	var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
	var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
	return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
};

function Link(a, b) {
	this.nodeA = a;
	this.nodeB = b;
	this.text = '';
	this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

	// make anchor point relative to the locations of nodeA and nodeB
	this.parallelPart = 0.5; // percentage from nodeA to nodeB
	this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
}

Link.prototype.getAnchorPoint = function() {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
		'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
	};
};

Link.prototype.setAnchorPoint = function(x, y) {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
	this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
	// snap to a straight lineF
	if(this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
		this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
		this.perpendicularPart = 0;
	}
};

Link.prototype.getEndPointsAndCircle = function() {
	if(this.perpendicularPart == 0) {
		var midX = (this.nodeA.x + this.nodeB.x) / 2;
		var midY = (this.nodeA.y + this.nodeB.y) / 2;
		var start = this.nodeA.closestPointOnCircle(midX, midY);
		var end = this.nodeB.closestPointOnCircle(midX, midY);
		return {
			'hasCircle': false,
			'startX': start.x,
			'startY': start.y,
			'endX': end.x,
			'endY': end.y,
		};
	}
	var anchor = this.getAnchorPoint();
	var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
	var isReversed = (this.perpendicularPart > 0);
	var reverseScale = isReversed ? 1 : -1;
	var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * nodeRadius / circle.radius;
	var endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * nodeRadius / circle.radius;
	var startX = circle.x + circle.radius * Math.cos(startAngle);
	var startY = circle.y + circle.radius * Math.sin(startAngle);
	var endX = circle.x + circle.radius * Math.cos(endAngle);
	var endY = circle.y + circle.radius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circle.x,
		'circleY': circle.y,
		'circleRadius': circle.radius,
		'reverseScale': reverseScale,
		'isReversed': isReversed,
	};
};

Link.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	if(stuff.hasCircle) {
		c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
	} else {
		c.moveTo(stuff.startX, stuff.startY);
		c.lineTo(stuff.endX, stuff.endY);
	}
	c.stroke();
	// draw the head of the arrow
	if(stuff.hasCircle) {
		drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
	} else {
		drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
	}
	// draw the text
	if(stuff.hasCircle) {
		var startAngle = stuff.startAngle;
		var endAngle = stuff.endAngle;
		if(endAngle < startAngle) {
			endAngle += Math.PI * 2;
		}
		var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
		var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
		var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
		drawText(c, this.text, textX, textY, textAngle, selectedObject == this);
	} else {
		var textX = (stuff.startX + stuff.endX) / 2;
		var textY = (stuff.startY + stuff.endY) / 2;
		var textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
		drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, selectedObject == this);
	}
};

Link.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	if(stuff.hasCircle) {
		var dx = x - stuff.circleX;
		var dy = y - stuff.circleY;
		var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
		if(Math.abs(distance) < hitTargetPadding) {
			var angle = Math.atan2(dy, dx);
			var startAngle = stuff.startAngle;
			var endAngle = stuff.endAngle;
			if(stuff.isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			if(angle < startAngle) {
				angle += Math.PI * 2;
			} else if(angle > endAngle) {
				angle -= Math.PI * 2;
			}
			return (angle > startAngle && angle < endAngle);
		}
	} else {
		var dx = stuff.endX - stuff.startX;
		var dy = stuff.endY - stuff.startY;
		var length = Math.sqrt(dx*dx + dy*dy);
		var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
		var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
	}
	return false;
};

function Node(x, y) {
	this.x = x;
	this.y = y;
	this.mouseOffsetX = 0;
	this.mouseOffsetY = 0;
	this.isAcceptState = false;
	this.text = '';
}

Node.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetX = this.x - x;
	this.mouseOffsetY = this.y - y;
};

Node.prototype.setAnchorPoint = function(x, y) {
	this.x = x + this.mouseOffsetX;
	this.y = y + this.mouseOffsetY;
};

Node.prototype.draw = function(c) {
    // 绘制节点圆圈
    c.beginPath();
    c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
    c.fillStyle = 'white'; // 节点填充颜色
    c.fill();
    c.stroke();

    // 设置文字颜色
    if (selectedNodes.includes(this) || selectedObject == this) {
        c.fillStyle = 'blue'; // 选中节点的文字颜色
    } else {
        c.fillStyle = 'black'; // 默认文字颜色
    }

    // 绘制节点文字
    drawText(c, this.text, this.x, this.y, null, selectedObject == this);

    // 如果是接受状态，绘制双圈
    if (this.isAcceptState) {
        c.beginPath();
        c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
        c.stroke();
    }
};


Node.prototype.closestPointOnCircle = function(x, y) {
	var dx = x - this.x;
	var dy = y - this.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.x + dx * nodeRadius / scale,
		'y': this.y + dy * nodeRadius / scale,
	};
};

Node.prototype.containsPoint = function(x, y) {
	return (x - this.x)*(x - this.x) + (y - this.y)*(y - this.y) < nodeRadius*nodeRadius;
};

function SelfLink(node, mouse) {
	this.node = node;
	this.anchorAngle = 0;
	this.mouseOffsetAngle = 0;
	this.text = '';

	if(mouse) {
		this.setAnchorPoint(mouse.x, mouse.y);
	}
}

SelfLink.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function(x, y) {
	this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
	// snap to 90 degrees
	var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
	if(Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
	// keep in the range -pi to pi so our containsPoint() function always works
	if(this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
	if(this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function() {
	var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
	var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
	var circleRadius = 0.75 * nodeRadius;
	var startAngle = this.anchorAngle - Math.PI * 0.8;
	var endAngle = this.anchorAngle + Math.PI * 0.8;
	var startX = circleX + circleRadius * Math.cos(startAngle);
	var startY = circleY + circleRadius * Math.sin(startAngle);
	var endX = circleX + circleRadius * Math.cos(endAngle);
	var endY = circleY + circleRadius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circleX,
		'circleY': circleY,
		'circleRadius': circleRadius
	};
};

SelfLink.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, false);
	c.stroke();
	// draw the text on the loop farthest from the node
	var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
	var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
	drawText(c, this.text, textX, textY, this.anchorAngle, selectedObject == this);
	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	var dx = x - stuff.circleX;
	var dy = y - stuff.circleY;
	var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
	return (Math.abs(distance) < hitTargetPadding);
};

function TemporaryLink(from, to) {
	this.from = from;
	this.to = to;
}

TemporaryLink.prototype.draw = function(c) {
	// draw the line
	c.beginPath();
	c.moveTo(this.to.x, this.to.y);
	c.lineTo(this.from.x, this.from.y);
	c.stroke();

	// draw the head of the arrow
	drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
};

function restoreBackup() {
	if(!localStorage || !JSON) {
		return;
	}

	try {
		var backup = JSON.parse(localStorage['fsm']);

		for(var i = 0; i < backup.nodes.length; i++) {
			var backupNode = backup.nodes[i];
			var node = new Node(backupNode.x, backupNode.y);
			node.isAcceptState = backupNode.isAcceptState;
			node.text = backupNode.text;
			nodes.push(node);
		}
		for(var i = 0; i < backup.links.length; i++) {
			var backupLink = backup.links[i];
			var link = null;
			if(backupLink.type == 'SelfLink') {
				link = new SelfLink(nodes[backupLink.node]);
				link.anchorAngle = backupLink.anchorAngle;
				link.text = backupLink.text;
			} else if(backupLink.type == 'StartLink') {
				link = new StartLink(nodes[backupLink.node]);
				link.deltaX = backupLink.deltaX;
				link.deltaY = backupLink.deltaY;
				link.text = backupLink.text;
			} else if(backupLink.type == 'Link') {
				link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
				link.parallelPart = backupLink.parallelPart;
				link.perpendicularPart = backupLink.perpendicularPart;
				link.text = backupLink.text;
				link.lineAngleAdjust = backupLink.lineAngleAdjust;
			}
			if(link != null) {
				links.push(link);
			}
		}
	} catch(e) {
		localStorage['fsm'] = '';
	}
}

function saveBackup() {
	if(!localStorage || !JSON) {
		return;
	}

	var backup = {
		'nodes': [],
		'links': [],
	};
	for(var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var backupNode = {
			'x': node.x,
			'y': node.y,
			'text': node.text,
			'isAcceptState': node.isAcceptState,
		};
		backup.nodes.push(backupNode);
	}
	for(var i = 0; i < links.length; i++) {
		var link = links[i];
		var backupLink = null;
		if(link instanceof SelfLink) {
			backupLink = {
				'type': 'SelfLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'anchorAngle': link.anchorAngle,
			};
		} else if(link instanceof StartLink) {
			backupLink = {
				'type': 'StartLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'deltaX': link.deltaX,
				'deltaY': link.deltaY,
			};
		} else if(link instanceof Link) {
			backupLink = {
				'type': 'Link',
				'nodeA': nodes.indexOf(link.nodeA),
				'nodeB': nodes.indexOf(link.nodeB),
				'text': link.text,
				'lineAngleAdjust': link.lineAngleAdjust,
				'parallelPart': link.parallelPart,
				'perpendicularPart': link.perpendicularPart,
			};
		}
		if(backupLink != null) {
			backup.links.push(backupLink);
		}
	}

	localStorage['fsm'] = JSON.stringify(backup);
}

function det(a, b, c, d, e, f, g, h, i) {
	return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
	var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
	var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
	var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
	return {
		'x': -bx / (2*a),
		'y': -by / (2*a),
		'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
	};
}

function fixed(number, digits) {
	return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

var greekLetterNames = [ 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' ];

function convertLatexShortcuts(text) {
	// html greek characters
	for(var i = 0; i < greekLetterNames.length; i++) {
		var name = greekLetterNames[i];
		text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16)));
		text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16)));
	}

	// subscripts
	for(var i = 0; i < 10; i++) {
		text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
	}

	return text;
}

function textToXML(text) {
	text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	var result = '';
	for(var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if(c >= 0x20 && c <= 0x7E) {
			result += text[i];
		} else {
			result += '&#' + c + ';';
		}
	}
	return result;
}

function drawArrow(c, x, y, angle) {
	var dx = Math.cos(angle);
	var dy = Math.sin(angle);
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
	c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
	c.fill();
}

function canvasHasFocus() {
	return (document.activeElement || document.body) == document.body;
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
	text = convertLatexShortcuts(originalText);
	c.font = '20px "Times New Roman", serif';
	var width = c.measureText(text).width;

	// center the text
	x -= width / 2;

	// position the text intelligently if given an angle
	if(angleOrNull != null) {
		var cos = Math.cos(angleOrNull);
		var sin = Math.sin(angleOrNull);
		var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
		var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
	}

	// draw text and caret (round the coordinates so the caret falls on a pixel)
	if('advancedFillText' in c) {
		c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
	} else {
		x = Math.round(x);
		y = Math.round(y);
		c.fillText(text, x, y + 6);
		if(isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
			x += width;
			c.beginPath();
			c.moveTo(x, y - 10);
			c.lineTo(x, y + 10);
			c.stroke();
		}
	}
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; draw()', 500);
	caretVisible = true;
}

var canvas;
var nodeRadius = 30;
var nodes = [];
var links = [];

var cursorVisible = true;
var snapToPadding = 3; // 自动对齐吸力大小
var hitTargetPadding = 6; // pixels
var selectedObject = null; // either a Link or a Node
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

function drawUsing(c) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(0.5, 0.5);

    // 绘制节点
    for (var i = 0; i < nodes.length; i++) {
        c.lineWidth = 1;
        var isSelectedNode = selectedNodes.includes(nodes[i]) || nodes[i] == selectedObject;
        c.strokeStyle = isSelectedNode ? 'blue' : 'black';
        nodes[i].draw(c);
    }

    // 绘制连接线
    for (var i = 0; i < links.length; i++) {
        c.lineWidth = 1;
        var isSelectedLink = selectedLinks.includes(links[i]) || links[i] == selectedObject;
        c.strokeStyle = isSelectedLink ? 'blue' : 'black';
        c.fillStyle = isSelectedLink ? 'blue' : 'black';
        links[i].draw(c);
    }

    // 绘制当前连接线
    if (currentLink != null) {
        c.lineWidth = 1;
        c.strokeStyle = 'black';
        c.fillStyle = 'black';
        currentLink.draw(c);
    }

    // 绘制选择框
    if (selectionStart && selectionEnd) {
        c.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        c.lineWidth = 2;
        c.strokeRect(selectionStart.x, selectionStart.y, selectionEnd.x - selectionStart.x, selectionEnd.y - selectionStart.y);
    }

    c.restore();
}


function draw() {
	drawUsing(canvas.getContext('2d'));
	saveBackup();
}

function selectObject(x, y) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i].containsPoint(x, y)) {
			return nodes[i];
		}
	}
	for(var i = 0; i < links.length; i++) {
		if(links[i].containsPoint(x, y)) {
			return links[i];
		}
	}
	return null;
}

function snapNode(node) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i] == node) continue;

		if(Math.abs(node.x - nodes[i].x) < snapToPadding) {
			node.x = nodes[i].x;
		}

		if(Math.abs(node.y - nodes[i].y) < snapToPadding) {
			node.y = nodes[i].y;
		}
	}
}

window.onload = function() {
	canvas = document.getElementById('canvas');
	restoreBackup();
	draw();

	canvas.onmousedown = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);
		movingObject = false;
		originalClick = mouse;
	
		if (selectedObject != null) {
			// 如果点击到的是边或者节点的一部分且该元素被框选，则准备整体移动
			if (!selectedNodes.includes(selectedObject) && !selectedLinks.includes(selectedObject)) {
				// 点击的是未选中区域的元素，清空选中状态
				selectedNodes = [];
				selectedLinks = [];
	
				// 根据选中的对象类型，将其添加到相应的数组中
				if (selectedObject instanceof Node) {
					selectedNodes.push(selectedObject);
				} else if (selectedObject instanceof Link) {
					selectedLinks.push(selectedObject);
				}
			}
	
			if (shift && selectedObject instanceof Node) {
				currentLink = new SelfLink(selectedObject, mouse);
			} else if (selectedObject instanceof Node && selectedNodes.includes(selectedObject)) {
				// 点击的是框选区域中的节点，开始整体移动
				movingMultipleNodes = true;
				canvas.style.cursor = 'grab';  // 更改鼠标指针为手型
				originalClick = mouse;
			} else {
				movingObject = true;
				if (selectedObject.setMouseStart) {
					selectedObject.setMouseStart(mouse.x, mouse.y);
					canvas.style.cursor = 'grab';  // 更改鼠标指针为手型
				}
			}
			resetCaret();
		} else if (shift) {
			currentLink = new TemporaryLink(mouse, mouse);
		} else {
			// 没有点击任何选中对象，开始框选操作
			selectionStart = mouse;
			selectionEnd = mouse;
			selectedNodes = [];
			selectedLinks = [];
		}
	
		draw();
	
		if (canvasHasFocus()) {
			return false; // 禁止拖放行为
		} else {
			resetCaret();
			return true;
		}
	};

	canvas.ondblclick = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);

		if(selectedObject == null) {
			selectedObject = new Node(mouse.x, mouse.y);
			nodes.push(selectedObject);
			resetCaret();
			draw();
		} else if(selectedObject instanceof Node) {
			selectedObject.isAcceptState = !selectedObject.isAcceptState;
			draw();
		}
	};

	canvas.onmousemove = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
	
		if (selectionStart) {
			// 更新选择框结束点
			selectionEnd = mouse;
			draw(); // 实时绘制选择框
		} else if (movingMultipleNodes) {
			if (selectedNodes.length === 1) {
				// 只有一个节点被选中，按照单个节点移动处理
				var node = selectedNodes[0];
				node.x += mouse.x - originalClick.x;
				node.y += mouse.y - originalClick.y;
	
				// 启用吸附对齐功能
				snapNode(node);
	
				originalClick = mouse;  // 更新点击位置
				canvas.style.cursor = 'grabbing';  // 拖动时的手型
				draw();
			} else if (selectedNodes.length > 1) {
				// 移动多个选中的节点，关闭吸附对齐
				var dx = mouse.x - originalClick.x;
				var dy = mouse.y - originalClick.y;
	
				// 移动框选的所有节点
				for (var i = 0; i < selectedNodes.length; i++) {
					selectedNodes[i].x += dx;
					selectedNodes[i].y += dy;
				}
	
				originalClick = mouse;  // 更新点击位置
				canvas.style.cursor = 'grabbing';  // 拖动时的手型
				draw();
			}
		} else if (movingObject) {
			// 移动单个对象
			selectedObject.setAnchorPoint(mouse.x, mouse.y);
			if (selectedObject instanceof Node) {
				snapNode(selectedObject); // 保持单个节点移动时的吸附功能
			}
			canvas.style.cursor = 'grabbing';  // 拖动边时的手型
			draw();
		} else if (currentLink) {
			// 如果是链接
			var targetNode = selectObject(mouse.x, mouse.y);
			if (!(targetNode instanceof Node)) {
				targetNode = null;
			}
	
			if (selectedObject == null) {
				if (targetNode != null) {
					currentLink = new StartLink(targetNode, originalClick);
				} else {
					currentLink = new TemporaryLink(originalClick, mouse);
				}
			} else {
				if (targetNode == selectedObject) {
					currentLink = new SelfLink(selectedObject, mouse);
				} else if (targetNode != null) {
					currentLink = new Link(selectedObject, targetNode);
				} else {
					currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
				}
			}
			draw();
		}
	};
	
	

	canvas.onmouseup = function(e) {
		movingObject = false;
		movingMultipleNodes = false;
	
		// 恢复鼠标指针为默认样式
		canvas.style.cursor = 'default';
	
		if (selectionStart) {
			// 计算矩形框的范围
			var x1 = Math.min(selectionStart.x, selectionEnd.x);
			var y1 = Math.min(selectionStart.y, selectionEnd.y);
			var x2 = Math.max(selectionStart.x, selectionEnd.x);
			var y2 = Math.max(selectionStart.y, selectionEnd.y);
	
			// 判断哪些节点在框选区域内
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].x >= x1 && nodes[i].x <= x2 && nodes[i].y >= y1 && nodes[i].y <= y2) {
					selectedNodes.push(nodes[i]);  // 将节点加入选中列表
				}
			}
	
			// 检查节点之间的连接线
			selectedLinks = [];
			for (var i = 0; i < links.length; i++) {
				var link = links[i];
	
				if (link instanceof SelfLink || link instanceof StartLink) {
					// 如果是自环边或起始边，且关联的节点被选中，则高亮
					if (selectedNodes.includes(link.node)) {
						selectedLinks.push(link);
					}
				} else if (link instanceof Link) {
					// 如果是普通的连接线，只要任一端的节点被选中，就高亮
					if (selectedNodes.includes(link.nodeA) || selectedNodes.includes(link.nodeB)) {
						selectedLinks.push(link);
					}
				}
			}
	
			// 清除框选的状态
			selectionStart = null;
			selectionEnd = null;
			draw();  // 重新绘制
		}
	
		if (currentLink != null) {
			if (!(currentLink instanceof TemporaryLink)) {
				selectedObject = currentLink;
				links.push(currentLink);
				resetCaret();
			}
			currentLink = null;
			draw();
		}
	};
	
}

var shift = false;

document.onkeydown = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = true;
	} else if(!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if(key == 8) { // backspace key
		if(selectedObject != null && 'text' in selectedObject) {
			selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
			resetCaret();
			draw();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if(key == 46) { // delete key
		if(selectedObject != null) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i] == selectedObject) {
					nodes.splice(i--, 1);
				}
			}
			for(var i = 0; i < links.length; i++) {
				if(links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject) {
					links.splice(i--, 1);
				}
			}
			selectedObject = null;
			draw();
		}
	}
};

document.onkeyup = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = false;
	}
};

document.onkeypress = function(e) {
	// don't read keystrokes when other things have focus
	var key = crossBrowserKey(e);
	if(!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if(key >= 0x20 && key <= 0x7E && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObject != null && 'text' in selectedObject) {
		selectedObject.text += String.fromCharCode(key);
		resetCaret();
		draw();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if(key == 8) {
		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	}
};

function crossBrowserKey(e) {
	e = e || window.event;
	return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
	e = e || window.event;
	var obj = e.target || e.srcElement;
	var x = 0, y = 0;
	while(obj.offsetParent) {
		x += obj.offsetLeft;
		y += obj.offsetTop;
		obj = obj.offsetParent;
	}
	return { 'x': x, 'y': y };
}

function crossBrowserMousePos(e) {
	e = e || window.event;
	return {
		'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
		'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
	};
}

function crossBrowserRelativeMousePos(e) {
	var element = crossBrowserElementPos(e);
	var mouse = crossBrowserMousePos(e);
	return {
		'x': mouse.x - element.x,
		'y': mouse.y - element.y
	};
}

function output(text) {
	var element = document.getElementById('output');
	element.style.display = 'block';
	element.value = text;
}

function saveAsPNG() {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // 暂时取消选中对象的绘制
    var oldSelectedObject = selectedObject;
    selectedObject = null;

    // 重新绘制画布内容
    drawUsing(context);

    // 将当前画布转换为 PNG 数据
    var pngData = canvas.toDataURL('image/png');

    // 恢复选中对象
    selectedObject = oldSelectedObject;
    draw();  // 恢复选中对象后的画布绘制

    // 创建一个临时的 <a> 元素
    var link = document.createElement('a');
    link.href = pngData;
    link.download = '我爱小郭.png';  // 设置下载文件名

    // 将这个链接插入到 DOM 中，并模拟点击以触发下载
    document.body.appendChild(link);
    link.click();

    // 移除临时的 <a> 元素
    document.body.removeChild(link);
}

function saveAsSVG() {
	var exporter = new ExportAsSVG();
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(exporter);
	selectedObject = oldSelectedObject;
	var svgData = exporter.toSVG();
	output(svgData);
	// Chrome isn't ready for this yet, the 'Save As' menu item is disabled
	// document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function saveAsLaTeX() {
	var exporter = new ExportAsLaTeX();
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(exporter);
	selectedObject = oldSelectedObject;
	var texData = exporter.toLaTeX();
	output(texData);
}
function clearCanvas() {
    nodes = [];
    links = [];
    selectedObject = null;
    draw();  // 重新绘制清空后的画布
}

// 初始画布的宽度和高度
const initialWidth = 800;
const initialHeight = 600;

// 重置画布的尺寸为初始值，并提示用户确认
function resetCanvasSize() {
    var userConfirmed = confirm("重置画布尺寸将清空内容，该操作无法撤销！");
    if (userConfirmed) {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');

        // 重置宽度和高度为初始值
        canvas.width = initialWidth;
        canvas.height = initialHeight;

        // 重新设置画布样式
        canvas.style.width = initialWidth + "px";
        canvas.style.height = initialHeight + "px";

        // 清空画布内容
        context.clearRect(0, 0, canvas.width, canvas.height);

        // 清空节点和链接数组
        nodes = [];
        links = [];
        selectedObject = null;

        // 重新绘制清空后的画布
        draw();
    }
}


// 只增加画布的高度50%
function enlargeCanvasHeight() {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // 保存当前图像
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 增加50%的高度
    var oldHeight = canvas.height;
    canvas.height = oldHeight * 1.5;

    // 重新设置画布样式
    canvas.style.height = canvas.height + "px";

    // 重新绘制之前的图像，不改变图像的大小和位置
    context.putImageData(imageData, 0, 0);

    draw();  // 如果有额外的绘制操作需要执行
}

// 只增加画布的宽度50%
function enlargeCanvasWidth() {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // 保存当前图像
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 增加50%的宽度
    var oldWidth = canvas.width;
    canvas.width = oldWidth * 1.5;

    // 重新设置画布样式
    canvas.style.width = canvas.width + "px";

    // 重新绘制之前的图像，并保持左右两边扩展
    context.putImageData(imageData, (canvas.width - oldWidth) / 2, 0);

    draw();  // 如果有额外的绘制操作需要执行
}

// 框选复制、删除的功能
var clipboard = {
    nodes: [],
    links: []
};

document.onkeydown = function(e) {
    var key = crossBrowserKey(e);

    if (key == 16) {
        shift = true;
    } else if (!canvasHasFocus()) {
        return true;
    } else if (e.ctrlKey && key == 67) { // Ctrl+C
        handleCopy();
        return false; // 阻止默认事件
    } else if (e.ctrlKey && key == 86) { // Ctrl+V
        handlePaste();
        return false; // 阻止默认事件
    } else if (key == 46) { // Delete key
        handleDelete();
        return false; // 阻止默认事件
    } else if (key == 8) { // Backspace key
        if (selectedObject != null && 'text' in selectedObject) {
            selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
            resetCaret();
            draw();
        }
        return false;
    }
};

function handleCopy() {
    if (selectedNodes.length > 0 || selectedLinks.length > 0) {
        clipboard.nodes = [];
        clipboard.links = [];
        var nodeMap = new Map();

        // 复制节点
        selectedNodes.forEach(function(node) {
            var copiedNode = new Node(node.x, node.y);
            copiedNode.text = node.text;
            copiedNode.isAcceptState = node.isAcceptState;
            clipboard.nodes.push(copiedNode);
            nodeMap.set(node, copiedNode);
        });

        // 复制连接线
        selectedLinks.forEach(function(link) {
            var copiedLink = null;

            if (link instanceof SelfLink) {
                var newNode = nodeMap.get(link.node);
                if (newNode) {
                    copiedLink = new SelfLink(newNode);
                    copiedLink.text = link.text;
                    copiedLink.anchorAngle = link.anchorAngle;
                }
            } else if (link instanceof StartLink) {
                var newNode = nodeMap.get(link.node);
                if (newNode) {
                    copiedLink = new StartLink(newNode);
                    copiedLink.text = link.text;
                    copiedLink.deltaX = link.deltaX;
                    copiedLink.deltaY = link.deltaY;
                }
            } else if (link instanceof Link) {
                var newNodeA = nodeMap.get(link.nodeA);
                var newNodeB = nodeMap.get(link.nodeB);
                if (newNodeA && newNodeB) {
                    copiedLink = new Link(newNodeA, newNodeB);
                    copiedLink.text = link.text;
                    copiedLink.lineAngleAdjust = link.lineAngleAdjust;
                    copiedLink.parallelPart = link.parallelPart;
                    copiedLink.perpendicularPart = link.perpendicularPart;
                }
            }

            if (copiedLink) {
                clipboard.links.push(copiedLink);
            }
        });
    }
}

function handlePaste() {
    if (clipboard.nodes.length > 0) {
        var nodeMap = new Map();
        var offsetX = 20;
        var offsetY = 20;

        selectedNodes = [];
        selectedLinks = [];

        // 粘贴节点
        clipboard.nodes.forEach(function(copiedNode) {
            var newNode = new Node(copiedNode.x + offsetX, copiedNode.y + offsetY);
            newNode.text = copiedNode.text;
            newNode.isAcceptState = copiedNode.isAcceptState;
            nodes.push(newNode);
            nodeMap.set(copiedNode, newNode);
            selectedNodes.push(newNode);
        });

        // 粘贴连接线
        clipboard.links.forEach(function(copiedLink) {
            var newLink = null;

            if (copiedLink instanceof SelfLink) {
                var newNode = nodeMap.get(copiedLink.node);
                if (newNode) {
                    newLink = new SelfLink(newNode);
                    newLink.text = copiedLink.text;
                    newLink.anchorAngle = copiedLink.anchorAngle;
                }
            } else if (copiedLink instanceof StartLink) {
                var newNode = nodeMap.get(copiedLink.node);
                if (newNode) {
                    newLink = new StartLink(newNode);
                    newLink.text = copiedLink.text;
                    newLink.deltaX = copiedLink.deltaX;
                    newLink.deltaY = copiedLink.deltaY;
                }
            } else if (copiedLink instanceof Link) {
                var newNodeA = nodeMap.get(copiedLink.nodeA);
                var newNodeB = nodeMap.get(copiedLink.nodeB);
                if (newNodeA && newNodeB) {
                    newLink = new Link(newNodeA, newNodeB);
                    newLink.text = copiedLink.text;
                    newLink.lineAngleAdjust = copiedLink.lineAngleAdjust;
                    newLink.parallelPart = copiedLink.parallelPart;
                    newLink.perpendicularPart = copiedLink.perpendicularPart;
                }
            }

            if (newLink) {
                links.push(newLink);
                selectedLinks.push(newLink);
            }
        });

        draw();
    }
}

function handleDelete() {
    if (selectedNodes.length > 0 || selectedLinks.length > 0) {
        // 删除选中的节点
        selectedNodes.forEach(function(node) {
            var index = nodes.indexOf(node);
            if (index > -1) {
                nodes.splice(index, 1);
            }
            // 删除与该节点相关的连接线
            links = links.filter(function(link) {
                return !(link.node === node || link.nodeA === node || link.nodeB === node);
            });
        });

        // 删除选中的连接线
        selectedLinks.forEach(function(link) {
            var index = links.indexOf(link);
            if (index > -1) {
                links.splice(index, 1);
            }
        });

        // 清空选中状态
        selectedNodes = [];
        selectedLinks = [];
        selectedObject = null;

        draw();
    } else if (selectedObject != null) {
        // 删除单个选中的对象
        if (selectedObject instanceof Node) {
            var index = nodes.indexOf(selectedObject);
            if (index > -1) {
                nodes.splice(index, 1);
            }
            // 删除与该节点相关的连接线
            links = links.filter(function(link) {
                return !(link.node === selectedObject || link.nodeA === selectedObject || link.nodeB === selectedObject);
            });
        } else if (selectedObject instanceof Link || selectedObject instanceof SelfLink || selectedObject instanceof StartLink) {
            var index = links.indexOf(selectedObject);
            if (index > -1) {
                links.splice(index, 1);
            }
        }

        selectedObject = null;
        draw();
    }
}


