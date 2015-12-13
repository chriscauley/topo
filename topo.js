'use strict';
var topo = {};
topo.math = {
  dsq: function(xy1,xy2) { return Math.pow(xy1[0]-xy2[0],2) + Math.pow(xy1[1]-xy2[1],2); },
  d: function(xy1,xy2) { return Math.sqrt(Math.pow(xy1[0]-xy2[0],2) + Math.pow(xy1[1]-xy2[1],2)); },
  polyline_contains_point: function(line,point) {
    // line is currently {x:[],y:[]} point is [x,y] :(
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = line.length - 1; i < line.length; j = i++) {
        var xi = line.x[i], yi = line.y[i];
        var xj = line.x[j], yj = line.y[j];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
  },
}

class Topography {
  constructor(data) {
    this.canvas = document.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    var controls = document.createElement("controls");
    document.body.appendChild(controls);
    riot.mount("controls",{topography:this});
    this.data = data;
    this.resetData();
    this.scale = 1;
    this.rescale(1);
    this.dots = [];
    this.updateLines();
    this.clicked_time = new Date();
    this.matching_lines = [];
    this.canvas.addEventListener('mousedown',this.mousedown.bind(this))
    this.canvas.addEventListener('mouseup',this.mouseup.bind(this))
    this.canvas.addEventListener('mousemove',uR.dedribble(this.mousemove.bind(this),200,true))
  }
  updateLines() {
    this.closeLines();
    this.colorLines();
    this.addDots();
    this.checkDots();
    this.draw();
  }
  mousedown(event) {
    if (this.matching_lines.length == 0) { return; }
    if (new Date() - this.clicked_time > 1000) {
      this.clicked_line = this.matching_lines[0];
      this.clicked_time = new Date();
      return
    }
    var l  = this.matching_lines[0];
    l.x.push(l.x[0]);
    l.y.push(l.y[0]);
    this.updateLines()
  }
  mouseup(event) {
    if (this.matching_lines.length && this.matching_lines[0] != this.clicked_line) {
      this.joinLines(this.matching_lines[0],this.clicked_line);
      this.updateLines();
    }
  }
  joinLines(l1,l2) {
    var aa = topo.math.dsq([l1.x[0],l1.y[0]],[l2.x[0],l2.y[0]]);
    var ab = topo.math.dsq([l1.x[0],l1.y[0]],[l2.x[l2.length-1],l2.y[l2.length-1]]);
    var ba = topo.math.dsq([l1.x[l1.length-1],l1.y[l1.length-1]],[l2.x[0],l2.y[0]]);
    var bb = topo.math.dsq([l1.x[l1.length-1],l1.y[l1.length-1]],[l2.x[l2.length-1],l2.y[l2.length-1]]);
    var min = Math.min(aa,ab,ba,bb);
    if (min == aa) {
      l1.x = l1.x.reverse().concat(l2.x);
      l1.y = l1.y.reverse().concat(l2.y);
    }
    if (min == ab) {
      l1.x = l2.x.concat(l1.x);
      l1.y = l2.y.concat(l1.y);
    }
    if (min == ba) {
      l1.x = l1.x.concat(l2.x);
      l1.y = l1.y.concat(l2.y);
    }
    if (min == bb) {
      l1.x = l1.x.concat(l2.x.reverse());
      l1.y = l1.y.concat(l2.y.reverse());
    }
    this.deleteLine(l2);
  }
  deleteLine(l1) {
    var that = this, found = false;
    this.eachLine(function(l2,li) {
      if (!found && l2.id == l1.id) {
        that.lines.splice(li,1);
        found = true;
      }
    })
  }
  addDots() {
    var that = this;
    var shift = 2;
    var new_dots = 0;
    var total_tries = 0;
    this.eachLine(function(line) {
      if (!line.closed || line.contains_dots) { return };
      var pi = Math.floor(Math.random()*line.length);
      var tries = 20;
      while (--tries) { 
        var dot = [line.x[pi]+tries/4*(Math.random()-0.5),line.y[pi]+tries/4*(Math.random()-0.5)];
        if (topo.math.polyline_contains_point(line,dot)) {
          line.contains_dots = [dot];
          that.dots.push(dot);
          new_dots += 1
          line.tries = 20-tries;
          total_tries += 20-tries;
          break
        }
      }
    });
    if (new_dots) {
      setTimeout(function(){konsole.log((total_tries/new_dots).toFixed(2) + "tries/line")},2000)
    }
  }
  checkDots() {
    var that = this;
    this.eachLine(function(line) {
      uR.forEach(that.dots,function(dot) {
        if (!line.closed || !line.contains_dots || line.contains_dots.indexOf(dot) != -1) { return }
        if (topo.math.polyline_contains_point(line,dot)) {
          line.contains_dots.push(dot);
        };
      });
    });
  }
  mousemove(event) {
    var mousexy = [event.layerX,event.layerY];
    this.collideDots(mousexy);
    this.collideLines(mousexy);
    this.dashLines();
    this.draw();
  }
  collideLines(mousexy) { 
    var min_distance = Math.pow(4,2);
    var matching_lines = this.filterLines(function(line) {
      for (var i=0; i<line.x.length; i++) {
        if (topo.math.dsq([line.x[i],line.y[i]],mousexy) < min_distance) { return true; }
      }
    });
    if (matching_lines != this.matching_lines) {
      uR.forEach(this.matching_lines || [],function(line) { line.stroke = 1; })
      uR.forEach(matching_lines,function(line) { line.stroke = 3; })
      this.matching_lines = matching_lines;
      var line_nos = this.eachLine(function(line) {
        return line.id
      }, this.matching_lines)
      konsole.watch('over lines',line_nos)
    }
  }
  collideDots(mousexy) {
    var that = this;
    this.matched_dot = undefined;
    var min_distance = Math.pow(5,2);
    uR.forEach(this.dots, function(dot) { 
      if (topo.math.dsq(mousexy,dot) < min_distance) { that.matched_dot = dot; }
    });
  }
  draw() {
    this.context.clearRect(0,0,this.width,this.height);
    var ci=0;
    var that = this;
    this.eachLine(function(line) {
      that.context.beginPath();
      that.context.moveTo(line.x[0],line.y[0]);
      that.context.setLineDash(line.dashed?[10,5]:[]);
      for (var i=1;i<line.x.length;i++) { that.context.lineTo(line.x[i],line.y[i]); }
      that.context.strokeStyle = line.color;
      that.context.lineWidth = line.stroke || 1;
      that.context.stroke();
    })
    that.context.strokeStyle = 'red';
    that.context.lineWidth = 1;
    uR.forEach(this.dots,function(dot){
      var radius = (that.matched_dot == dot)?5:2;
      that.context.beginPath();
      that.context.arc(dot[0], dot[1], radius, 0, 2 * Math.PI, false);
      that.context.fillStyle = 'green';
      that.context.fill();
      that.context.stroke();
    });
  }
  closeLines() {
    this.eachLine(function(line) {
      if (line.x[0] == line.x[line.x.length-1] && line.y[0] == line.y[line.y.length-1]) {
        line.closed = true;
      } else { 
        line.closed = false;
      };
    });
  }    
  colorLines() {
    var colors = [
      '#f88','#8f8','#aaf',
      '#ff8','#f8f','#8ff',
    ];
    var ci = -1;
    this.eachLine(function(line) {
      if (line.closed) { line.color = 'black'; }
      else {
        line.color = line.color || colors[ci++];
        if (ci == colors.length - 1) { ci = 0; }
      }
    });
  }
  dashLines() {
    var that = this;
    this.eachLine(function(line) {
      line.dashed = line.contains_dots && line.contains_dots.indexOf(that.matched_dot) != -1;
    });
  }
  resetData() {
    this.lines = [];
    for (var li=0;li<this.data.polylines.length;li++) {
      var line = { x: [], y: [], stroke: 1, id: li };
      var pl = this.data.polylines[li];
      for (var i=0;i<pl[0].length;i++) {
        line.x.push(pl[0][i]);
        line.y.push(pl[1][i]);
      }
      line.length = line.x.length;
      this.lines.push(line);
    }
  }
  rescale(newscale) {
    var that = this;
    this.width = this.canvas.width = newscale*this.data.x_max+1;
    this.height = this.canvas.height = newscale*this.data.y_max+1;
    if (this.scale == newscale) { return }
    this.eachLine(function(line) {
      for (var i=0;i<line.x.length;i++) {
        line.x[i] = line.x[i]*newscale/that.scale;
        line.y[i] = line.y[i]*newscale/that.scale;
      }
    });
    uR.forEach(this.dots,function(dot) {
      dot[0] = dot[0]*newscale/that.scale;
      dot[1] = dot[1]*newscale/that.scale;
    });
    this.scale = newscale;
  }
  eachLine(func,lines) {
    lines = lines || this.lines;
    var result = [];
    for (var li=0;li<lines.length;li++) { result.push(func(lines[li],li)); }
    return result;
  }
  filterLines(func,lines) {
    lines = lines || this.lines;
    var result = [];
    for (var li=0;li<lines.length;li++) {
      if (func(lines[li])) { result.push(lines[li]) }
    }
    return result;
  }
  findLine(func,lines) { 
    lines = lines || this.lines;
    for (var li=0;li<lines.length;li++) { if (func(lines[li])) { return lines[li] } }
  }
}
$(function() {
  $.get('data.json',function(data){new Topography(data)},'json');
});
