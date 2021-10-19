function openRightPan() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("right_open_button_div").style.marginRight = "250px";
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
}

function closeRightPan() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("right_open_button_div").style.marginRight= "0";
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
}

function openUpPan() {
    document.getElementById("myUpbar").style.height = "40px";
    document.getElementById("up_open_button_div").style.marginTop = "40px";
    document.getElementById("top_button_div").style.marginTop = "40px";
    document.getElementById("myUpbar").style.zIndex = -1;
    d3.select("#up_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
    d3.select("#top_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)

    d3.json("data/families.json").then(familiesData => {

        var body = d3.select('#myUpbar')
            .selectAll('div')
            .data(familiesData)
            .enter()

        var family_choice_div = body.append('div')
        family_choice_group = family_choice_div.append("g")
            .attr("class", "add_div")
            .attr("id", d => {return "family_choice_div"+d.id})
            .style('left', (d,i)=> (((i+1) * 70)+(i*70))+"px")
        family_choice_group.append("p")
            .text(d=> d.name)
            .attr("id", d=> {return "family_choice_text"+d.id})
            .attr("class", "add_text")
            .style('margin-top', d=> {
                return ((30 - getDimensionAttr("family_choice_text"+d.id+"").height)/2 + "px")
            })
        family_choice_group.on("click", family_choice_click)
    })
}

function closeUpPan() {
    document.getElementById("myUpbar").style.height = "0";
    document.getElementById("up_open_button_div").style.marginTop= "0";
    document.getElementById("top_button_div").style.marginTop= "0";
    d3.select("#up_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    d3.select("#top_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    document.getElementById("myUpbar").style.zIndex = 1;
}

function family_choice_click(event,d) {
    d3.select("body").select('#myUpbar').selectAll("g").style("background", "white")
    d3.select(this).style("background", "#c2e4a0")
}

//Change right panel text
    //Regular space: &nbsp;
    //Two spaces gap: &ensp;
    //Four spaces gap: &emsp;

document.getElementById("right_panel_name_text").innerHTML = "right_panel_name_text";
document.getElementById("right_panel_sibling_text").innerHTML += "right_panel_sibling_text";
document.getElementById("right_panel_comment_text").innerHTML = "right_panel_comment_text";