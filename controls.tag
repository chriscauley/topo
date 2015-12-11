<controls>
  <button onclick={ zoom }>{ topography.scale }x</button>

  <style scoped>
    :scope {
      background: rgba(0,0,0,0.5);
      border: 4px double black;
      min-height: 200px;
      position: fixed;
      right: 0;
      top: 0;
      width: 200px;
    }
  </style>

  this.topography = this.opts.topography;
  zoom(e) {
    var scale = this.topography.scale + 1;
    if (scale > 5) { scale = 1; }
    this.topography.rescale(scale);
    this.topography.draw()
  }
    
</controls>
