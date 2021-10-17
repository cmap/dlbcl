d3.selectAll("#cyan").each(random)
setInterval(function(){
  d3.selectAll("#cyan").each(random)
},3000);

setTimeout(function(){
  d3.selectAll("#green").each(random)
  setInterval(function(){
    d3.selectAll("#green").each(random)
  },3000);
},500);

setTimeout(function(){
  d3.selectAll("#blue").each(random)
  setInterval(function(){
    d3.selectAll("#blue").each(random)
  },3000);
},1000);

setTimeout(function(){
  d3.selectAll("#yellow").each(random)
  setInterval(function(){
    d3.selectAll("#yellow").each(random)
  },3000);
},1500);

setTimeout(function(){
  d3.selectAll("#light_orange").each(random)
  setInterval(function(){
    d3.selectAll("#light_orange").each(random)
  },3000);
},2000);

setTimeout(function(){
  d3.selectAll("#dark_orange").each(random)
  setInterval(function(){
    d3.selectAll("#dark_orange").each(random)
  },3000);
},2500);

setTimeout(function(){
  d3.selectAll("#red").each(random)
  setInterval(function(){
    d3.selectAll("#red").each(random)
  },3000);
},3000);

function random(duration) {
    var circle = d3.select(this);
    circle.transition()
      .duration(3000)
      .ease("linear")
    .attr("transform",function(){
        return "translate(" + (10 - Math.random()*20) + "," + (10 - Math.random()*20) + ")"
    })
};
