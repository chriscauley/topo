'use strict';
var topo = {};
topo.math = {
  dsq: function(xy1,xy2) { return Math.pow(xy1[0]-xy2[0],2) + Math.pow(xy1[1]-xy2[1],2); },
  d: function(xy1,xy2) { return Math.sqrt(Math.pow(xy1[0]-xy2[0],2) + Math.pow(xy1[1]-xy2[1],2)); },
}

class Topography {
  constructor(data) {
    this.canvas = document.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.data = data;
    this.resetData();
    this.scale = 1;
    this.rescale(1);
    this.draw();
    this.canvas.addEventListener('mousedown',this.mousedown.bind(this))
    this.canvas.addEventListener('mousemove',uR.dedribble(this.mousemove.bind(this),200,true))
    var controls = document.createElement("controls");
    document.body.appendChild(controls);
    riot.mount("controls",{topography:this});
  }
  mousedown(event) {
    console.log(event);
  }
  mousemove(event) {
    var min_distance = Math.pow(4,2);
    var mousexy = [event.layerX,event.layerY];
    var matching_lines = this.filterLines(function(line) {
      for (var i=0; i<line.x.length; i++) {
        if (topo.math.dsq([line.x[i],line.y[i]],mousexy) < min_distance) { return true; }
      }
    });
    if (matching_lines == this.matching_lines) { return; }
    uR.forEach(this.matching_lines || [],function(line) { line.stroke = 1; })
    uR.forEach(matching_lines,function(line) { line.stroke = 3; })
    this.matching_lines = matching_lines;
    this.draw();
  }
  draw() {
    this.context.clearRect(0,0,this.width,this.height);
    var ci=0;
    var colors = [
      '#f88',
      '#8f8',
      '#aaf',
      '#ff8',
      '#f8f',
      '#8ff',
    ];
    var that = this;
    this.eachLine(function(line) {
      that.context.beginPath();
      that.context.moveTo(line.x[0],line.y[0]);
      for (var i=1;i<line.x.length;i++) { that.context.lineTo(line.x[i],line.y[i]); }
      that.context.strokeStyle = 'black'
      that.context.lineWidth = line.stroke || 1;
      if (!(line.x[0] == line.x[line.x.length-1] && line.y[0] == line.y[line.y.length-1])) {
        that.context.strokeStyle = colors[ci++];
        if (ci == colors.length) { ci = 0; }
      };
      that.context.stroke();
    })
  }
  resetData() {
    this.lines = [];
    for (var li=0;li<this.data.polylines.length;li++) {
      var line = { x: [], y: [], color: "black", stroke: 1 };
      var pl = this.data.polylines[li];
      for (var i=0;i<pl[0].length;i++) {
        line.x.push(pl[0][i]);
        line.y.push(pl[1][i]);
      }
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
    this.scale = newscale;
  }
  eachLine(func,lines) {
    lines = lines || this.lines;
    var result = [];
    for (var li=0;li<this.lines.length;li++) { result.push(func(this.lines[li])); }
    return result;
  }
  filterLines(func,lines) {
    lines = lines || this.lines;
    var result = [];
    for (var li=0;li<this.lines.length;li++) {
      if (func(this.lines[li])) { result.push(this.lines[li]) }
    }
    return result;
  }
  findLine(func,lines) { 
    lines = lines || this.lines;
    for (var li=0;li<this.lines.length;li++) { if (func(this.lines[li])) { return this.lines[li] } }
  }
}
$(function() {
  $.get('data.json',function(data){new Topography(data)},'json');
});
