d3.svg.axis = function() {
  var scale = d3.scale.linear(),
      orient = Math.PI/2,   // default: "bottom"
      tickAngle = Math.PI/2,  // angle between axis and ticks (affects labels and legend too)
      shift = 0,  // translation along ticks
      legend = null,
      tickMajorSize = 6,
      tickMinorSize = 6,
      tickEndSize = 6,
      tickPadding = 3,
      tickArguments_ = [10],
      tickValues = null,
      tickFormat_,
      tickSubdivide = 0;

  function axis(g) {
    g.each(function() {
      var g = d3.select(this);

      // Ticks, or domain values for ordinal scales.
      var ticks = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain()) : tickValues,
          tickFormat = tickFormat_ == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments_) : String) : tickFormat_;

      // Minor ticks.
      var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide),
          subtick = g.selectAll(".minor").data(subticks, String),
          subtickEnter = subtick.enter().insert("line", "g").attr("class", "tick minor").style("opacity", 1e-6),
          subtickExit = d3.transition(subtick.exit()).style("opacity", 1e-6).remove(),
          subtickUpdate = d3.transition(subtick).style("opacity", 1);

      // Major ticks.
      var tick = g.selectAll("g").data(ticks, String),
          tickEnter = tick.enter().insert("g", "path").style("opacity", 1e-6),
          tickExit = d3.transition(tick.exit()).style("opacity", 1e-6).remove(),
          tickUpdate = d3.transition(tick).style("opacity", 1),
          tickTransform;

      // Domain.
      var range = d3_scaleRange(scale),
          path = g.selectAll(".domain").data([0]),
          pathEnter = path.enter().append("path").attr("class", "domain"),
          pathUpdate = d3.transition(path);

      // Geometry for ticks, labels, legend
      var U = d3_svg_axisUnitVector(orient),
	  tickU = d3_svg_axisUnitVector(orient + tickAngle),
	  labelDist = Math.max(tickMajorSize, 0) + tickPadding,
	  m = ((tickAngle / (2*Math.PI)) % 1 + 1) % 1 < .5 ? -1: 1,
	  labelU = { x: (tickU.x+m*U.y)/2, y: (tickU.y-m*U.x)/2 };

      var halfRange = (range[0] + range[1])/2,
	  orientDeg = orient * 180 / Math.PI,
	  legendDist = labelDist + 3*tickPadding,
	  leg = g.selectAll("g.axisLegend").data([legend]);

      // Stash a snapshot of the new scale, and retrieve the old snapshot.
      var scale1 = scale.copy(),
          scale0 = this.__chart__ || scale1;
      this.__chart__ = scale1;


      // shift group
      d3.transition(g).attr("transform", "translate("+shift*tickU.x+","+shift*tickU.y+")");

      tickEnter.append("line").attr("class", "tick");
      tickEnter.append("text");

      subtickEnter.attr("x2", tickMinorSize * tickU.x).attr("y2", tickMinorSize * tickU.y);
      subtickUpdate.attr("x2", tickMinorSize * tickU.x).attr("y2", tickMinorSize * tickU.y);
      tickEnter.select("line").attr("x2", tickMajorSize * tickU.x).attr("y2", tickMajorSize * tickU.y);
      tickEnter.select("text").attr("x", labelDist * labelU.x).attr("y", labelDist * labelU.y);
      tickUpdate.select("line").attr("x2", tickMajorSize * tickU.x).attr("y2", tickMajorSize * tickU.y);
      tickUpdate.select("text").text(tickFormat)
	.attr("x", labelDist * labelU.x).attr("y", labelDist * labelU.y).attr("dy", (labelU.y + 1) * .35 + "em")
	.attr("text-anchor", (Math.abs(labelU.y) > .5) ? "middle" : ((labelU.x > 0) ? "start": "end") );
      pathUpdate.attr("d", " M " + (range[0]*U.x + tickEndSize*tickU.x) + " " + (range[0]*U.y + tickEndSize*tickU.y) + " L " + range[0]*U.x + " " + range[0]*U.y + " L " + range[1]*U.x + " " + range[1]*U.y + " " + (range[1]*U.x + tickEndSize*tickU.x) + " " + (range[1]*U.y + tickEndSize*tickU.y));

      tickTransform = function(selection, scale) {
	selection.attr("transform", function(d) { var r = scale(d); return "translate("+r*U.x+","+r*U.y+")"; });
      };

      // For quantitative scales:
      // - enter new ticks from the old scale
      // - exit old ticks to the new scale
      if (scale.ticks) {
        tickEnter.call(tickTransform, scale0);
        tickUpdate.call(tickTransform, scale1);
        tickExit.call(tickTransform, scale1);
        subtickEnter.call(tickTransform, scale0);
        subtickUpdate.call(tickTransform, scale1);
        subtickExit.call(tickTransform, scale1);
      }

      // For ordinal scales:
      // - any entering ticks are undefined in the old scale
      // - any exiting ticks are undefined in the new scale
      // Therefore, we only need to transition updating ticks.
      else {
        var dx = scale1.rangeBand() / 2, x = function(d) { return scale1(d) + dx; };
        tickEnter.call(tickTransform, x);
        tickUpdate.call(tickTransform, x);
      }

      leg.enter().append("g").attr("class", "axisLegend").append("text");
      leg.attr("transform", "translate("+(halfRange*U.x + (m*U.y*legendDist))+","+(halfRange*U.y+(-m*U.x*legendDist))+")" + "rotate("+(orientDeg + (((orientDeg % 360)+360)%360 > 180 ? 90 : -90))+")")
	  .select("text").text(legend).attr("text-anchor", "middle").attr("dy", "0em");

    });
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    switch (x) {
      case "bottom": orient = tickAngle = Math.PI/2; break;
      case "top": orient = Math.PI/2; tickAngle = -Math.PI/2; break;
      case "left": orient = Math.PI; tickAngle = Math.PI/2; break;
      case "right": orient = Math.PI; tickAngle = -Math.PI/2; break;
      default: orient = x;
    }
    return axis;
  };

  axis.orientVector = function(v) {
    if (!arguments.length) return d3_svg_axisUnitVector(orient);
    return axis.orient(Math.atan2(v.x,-v.y));
  };

  axis.tickAngle = function(x) {
    if (!arguments.length) return tickAngle;
    tickAngle = x;
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments_;
    tickArguments_ = arguments;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat_;
    tickFormat_ = x;
    return axis;
  };

  axis.tickSize = function(x, y, z) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1;
    tickMajorSize = +x;
    tickMinorSize = n > 1 ? +y : tickMajorSize;
    tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };

  axis.shift = function(x) {
    if (!arguments.length) return shift;
    shift = x;
    return axis;
  };

  axis.legend = function(x) {
    if (!arguments.length) return legend;
    legend = x;
    return axis;
  };

  return axis;
};

function d3_svg_axisUnitVector(orient) {
  var a = orient - Math.PI/2;  // same as orient + d3_svg_arcOffset;
  return { x: Math.cos(a), y: Math.sin(a) };
}

function d3_svg_axisSubdivide(scale, ticks, m) {
  var subticks = [];
  if (m && ticks.length > 1) {
    var extent = d3_scaleExtent(scale.domain()),
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}
