function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("right_open_button_div").style.marginRight = "250px";
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("right_open_button_div").style.marginRight= "0";
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
}

var div = document.getElementById('#mySidebar');
div.innerHTML += 'Extra stuff';