<controls>
  <button onclick={ zoom }>{ topography.scale }x</button>

  <style scoped>
    :scope {
      background: rgba(255,255,255,0.8);
      border: 4px double black;
      min-height: 200px;
      position: fixed;
      right: 0;
      top: 0;
      width: 200px;
    }
  </style>

  this.topography = this.opts.topography;
  this.on("mount",function() {
    this.root.appendChild(document.createElement("konsole"));
    riot.mount("konsole");
  });
  zoom(e) {
    var scale = this.topography.scale + 1;
    if (scale > 5) { scale = 1; }
    this.topography.rescale(scale);
    this.topography.draw()
  }
    
</controls>
