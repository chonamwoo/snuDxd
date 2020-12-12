let RadarChart = {
	defaultConfig: {
	  containerClass: 'radar-chart',
	  w: 200,
	  h: 200,
	  factor: 0.95,
	  factorLegend: 1,
	  levels: 3,
	  levelTick: false,
	  TickLength: 10,
	  maxValue: 0,
	  minValue: 0,
	  radians: 2 * Math.PI,
	  color: d3.schemeSet3[0],
	  axisLine: true,
	  axisText: true,
	  circles: true,
	  radius: 4,
	  open: false,
	  backgroundTooltipColor: "#555",
	  backgroundTooltipOpacity: "0.7",
	  tooltipColor: "white",
	  axisJoin: function(d, i) {
		return d.className || i;
	  },
	  tooltipFormatValue: function(d) {
		return d;
	  },
	  tooltipFormatClass: function(d) {
		return d;
	  },
	  transitionDuration: 1000
	},
	chart: function() {
	  // default config
	  let cfg = Object.create(RadarChart.defaultConfig);
	  function setTooltip(tooltip, msg){
		if(msg === false || msg == undefined){
		  tooltip.classed("visible", 0);
		  tooltip.select("rect").classed("visible", 0);
		}else{
		  tooltip.classed("visible", 1);
  
		  let container = tooltip.node().parentNode;
		  let coords = d3.mouse(container);
  
		  tooltip.select("text").classed('visible', 1).style("fill", cfg.tooltipColor);
		  let padding=5;
		  let bbox = tooltip.select("text").text(msg).node().getBBox();
  
		  tooltip.select("rect")
		  .classed('visible', 1).attr("x", 0)
		  .attr("x", bbox.x - padding)
		  .attr("y", bbox.y - padding)
		  .attr("width", bbox.width + (padding*2))
		  .attr("height", bbox.height + (padding*2))
		  .attr("rx","5").attr("ry","5")
		  .style("fill", cfg.backgroundTooltipColor).style("opacity", cfg.backgroundTooltipOpacity);
		  tooltip.attr("transform", "translate(" + (coords[0]+10) + "," + (coords[1]-10) + ")")
		}
	  }
	  function radar(selection) {
		selection.each(function(data) {
		  let container = d3.select(this);
		  let tooltip = container.selectAll('g.tooltip').data([data[0]]);
  
		  let tt = tooltip.enter()
		  .append('g')
		  .classed('tooltip', true)
  
		  tt.append('rect').classed("tooltip", true);
		  tt.append('text').classed("tooltip", true);
  
		  // allow simple notation
		  data = data.map(function(datum) {
			if(datum instanceof Array) {
			  datum = {axes: datum};
			}
			return datum;
		  });
  
		  let maxValue = Math.max(cfg.maxValue, d3.max(data, function(d) {
			return d3.max(d.axes, function(o){ return o.value; });
		  }));
		  maxValue -= cfg.minValue;
  
		  let allAxis = data[0].axes.map(function(i, j){ return {name: i.axis, xOffset: (i.xOffset)?i.xOffset:0, yOffset: (i.yOffset)?i.yOffset:0}; });
		  let total = allAxis.length;
		  let radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
		  let radius2 = Math.min(cfg.w / 2, cfg.h / 2);
  
		  container.classed(cfg.containerClass, 1);
  
		  function getPosition(i, range, factor, func){
			factor = typeof factor !== 'undefined' ? factor : 1;
			return range * (1 - factor * func(i * cfg.radians / total));
		  }
		  function getHorizontalPosition(i, range, factor){
			return getPosition(i, range, factor, Math.sin);
		  }
		  function getVerticalPosition(i, range, factor){
			return getPosition(i, range, factor, Math.cos);
		  }
  
		  // levels && axises
		  let levelFactors = d3.range(0, cfg.levels).map(function(level) {
			return radius * ((level + 1) / cfg.levels);
		  });
  
		  let levelGroups = container.selectAll('g.level-group').data(levelFactors);
  
		  levelGroups.exit().remove();
		  levelGroups = levelGroups.enter().append('g');
  
		  levelGroups.attr('class', function(d, i) {
			return 'level-group level-group-' + i;
		  });
  
		  let levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
			return d3.range(0, total).map(function() { return levelFactor; });
		  });
  
		  levelLine.exit().remove();
		  levelLine = levelLine.enter().append('line');
  
		  if (cfg.levelTick){
			levelLine
			.attr('class', 'level')
			.attr('x1', function(levelFactor, i){
			  if (radius == levelFactor) {
				return getHorizontalPosition(i, levelFactor);
			  } else {
				return getHorizontalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
			  }
			})
			.attr('y1', function(levelFactor, i){
			  if (radius == levelFactor) {
				return getVerticalPosition(i, levelFactor);
			  } else {
				return getVerticalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
			  }
			})
			.attr('x2', function(levelFactor, i){
			  if (radius == levelFactor) {
				return getHorizontalPosition(i+1, levelFactor);
			  } else {
				return getHorizontalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
			  }
			})
			.attr('y2', function(levelFactor, i){
			  if (radius == levelFactor) {
				return getVerticalPosition(i+1, levelFactor);
			  } else {
				return getVerticalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
			  }
			})
			.attr('transform', function(levelFactor) {
			  return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
			});
		  }
		  else{
			levelLine
			.attr('class', 'level')
			.attr('x1', function(levelFactor, i){ return getHorizontalPosition(i, levelFactor); })
			.attr('y1', function(levelFactor, i){ return getVerticalPosition(i, levelFactor); })
			.attr('x2', function(levelFactor, i){ return getHorizontalPosition(i+1, levelFactor); })
			.attr('y2', function(levelFactor, i){ return getVerticalPosition(i+1, levelFactor); })
			.attr('transform', function(levelFactor) {
			  return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
			});
		  }
		  if(cfg.axisLine || cfg.axisText) {
			let axis = container.selectAll('.axis').data(allAxis);
  
			axis.exit().remove();
			axis = axis.enter().append('g');
			if(cfg.axisLine) {
			  axis.append('line');
			}
			if(cfg.axisText) {
			  axis.append('text');
			}
  
			axis.attr('class', 'axis');
  
			if(cfg.axisLine) {
			  axis.select('line')
			  .attr('x1', cfg.w/2)
			  .attr('y1', cfg.h/2)
			  .attr('x2', function(d, i) { return (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factor); })
			  .attr('y2', function(d, i) { return (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor); });
			}
  
			if(cfg.axisText) {
			  axis.select('text')
			  .attr('class', function(d, i){
				let p = getHorizontalPosition(i, 0.5);
  
				return 'legend ' +
				((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
			  })
			  .attr('dy', function(d, i) {
				let p = getVerticalPosition(i, 0.5);
				return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
			  })
			  .text(function(d) { return d.name; })
			  .attr('x', function(d, i){ return d.xOffset+ (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factorLegend); })
			  .attr('y', function(d, i){ return d.yOffset+ (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factorLegend); });
			}
		  }
  
		  // content
		  data.forEach(function(d){
			d.axes.forEach(function(axis, i) {
			  axis.x = (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, (parseFloat(Math.max(axis.value - cfg.minValue, 0))/maxValue)*cfg.factor);
			  axis.y = (cfg.h/2-radius2)+getVerticalPosition(i, radius2, (parseFloat(Math.max(axis.value - cfg.minValue, 0))/maxValue)*cfg.factor);
			});
		  });
		  let polygon = container.selectAll(".area").data(data, cfg.axisJoin);
  
		  let polygonType = 'polygon';
		  if (cfg.open) {
			polygonType = 'polyline';
		  }
  
		  polygon.exit()
		  .classed('d3-exit', 1) // trigger css transition
		  .transition().duration(cfg.transitionDuration)
		  .remove();
  
		  polygon = polygon.enter().append(polygonType)
		  .classed('area d3-enter', true)
		  .on('mouseenter', function (dd){
			container.classed('focus', 1);
			d3.select(this).classed('focused', 1);
			setTooltip(tooltip, cfg.tooltipFormatClass(dd.className));
		  })
		  .on('mouseleave', function(){
			container.classed('focus', 0);
			d3.select(this).classed('focused', 0);
			setTooltip(tooltip, false);
		  });
  
		  polygon
		  .each(function(d, i) {
			let classed = {'d3-exit': 0}; // if exiting element is being reused
			classed['radar-chart-serie' + i] = 1;
			if(d.className) {
			  classed[d.className] = 1;
			}
			d3.select(this).classed(classed);
		  })
		  // styles should only be transitioned with css
		  .style('stroke', function(d, i) { return cfg.color; })
		  .style('fill', function(d, i) { return cfg.color; })
		  .attr('points', function(d) {
			return d.axes.map(function(p) {
			  return [cfg.w / 2, cfg.h / 2].join(',');
			}).join(' ');
		  })
		  .transition().duration(cfg.transitionDuration)
		  // svg attrs with js
		  .attr('points',function(d) {
			return d.axes.map(function(p) {
			  return [p.x, p.y].join(',');
			}).join(' ');
		  })
		  .each(function() {
			d3.select(this).classed('d3-enter', 0); // trigger css transition
		  });
  
		  if(cfg.circles && cfg.radius) {
  
			let circleGroups = container.selectAll('g.circle-group').data(data, cfg.axisJoin);

			circleGroups.exit()
			.classed('d3-exit', 1) // trigger css transition
			.transition().duration(cfg.transitionDuration).remove();
			circleGroups = circleGroups.enter().append('g').classed('circle-group d3-enter', true);
  
			circleGroups
			.each(function(d) {
			  let classed = {'d3-exit': 0}; // if exiting element is being reused
			  if(d.className) {
				classed[d.className] = 1;
			  }
			  d3.select(this).classed(classed);
			})
			.transition().duration(cfg.transitionDuration)
			.each(function() {
			  d3.select(this).classed('d3-enter', 0); // trigger css transition
			});
  
			let circle = circleGroups.selectAll('.circle').data(function(datum, i) {
			  return datum.axes.map(function(d) { return [d, i]; });
			});
  
			circle.exit()
			.classed('d3-exit', 1) // trigger css transition
			.transition().duration(cfg.transitionDuration).remove();
  
			circle = circle.enter().append('circle')
			.classed('circle d3-enter', true)
			.on('mouseenter', function(dd){
			  setTooltip(tooltip, cfg.tooltipFormatValue(dd[0].value));
			  //container.classed('focus', 1);
			  //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 1);
			})
			.on('mouseleave', function(dd){
			  setTooltip(tooltip, false);
			  container.classed('focus', 0);
			  //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 0);
			  //No idea why previous line breaks tooltip hovering area after hoverin point.
			});
  
			circle
			.each(function(d) {
			  let classed = {'d3-exit': 0}; // if exit element reused
			  classed['radar-chart-serie'+d[1]] = 1;
			  d3.select(this).classed(classed);
			})
			// styles should only be transitioned with css
			.style('fill', function(d) { return cfg.color; })
			.attr('cx', cfg.w / 2).attr('cy', cfg.h / 2)
			.transition().duration(cfg.transitionDuration)
			// svg attrs with js
			.attr('r', cfg.radius)
			.attr('cx', function(d) {
			  return d[0].x;
			})
			.attr('cy', function(d) {
			  return d[0].y;
			})
			.each(function() {
			  d3.select(this).classed('d3-enter', 0); // trigger css transition
			});
  
			// //Make sure layer order is correct
			// console.log(polygon)
			// let poly_node = polygon.node();
			// poly_node.parentNode.appendChild(poly_node);
  
			// let cg_node = circleGroups.node();
			// cg_node.parentNode.appendChild(cg_node);
  
			// // ensure tooltip is upmost layer
			// let tooltipEl = tooltip.node();
			// tooltipEl.parentNode.appendChild(tooltipEl);
		  }
		});
	  }
  
	  radar.config = function(value) {
		if(!arguments.length) {
		  return cfg;
		}
		if(arguments.length > 1) {
		  cfg[arguments[0]] = arguments[1];
		}
		else {
		  d3.entries(value || {}).forEach(function(option) {
			cfg[option.key] = option.value;
		  });
		}
		return radar;
	  };
  
	  return radar;
	},
	draw: function(id, d, options) {
	  let chart = RadarChart.chart().config(options);
	  let cfg = chart.config();
  
	  d3.select(id).select('svg').remove();
	  d3.select(id)
	  .append("svg")
	  .attr("width", cfg.w)
	  .attr("height", cfg.h)
	  .datum(d)
	  .call(chart);
	}
  };
