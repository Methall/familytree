var initial_family_tree = "frank_peter"
var top_panel_init = true
var right_panel_init = false

family_tree(initial_family_tree,"1",right_panel_init,top_panel_init)

function family_tree(family_tree_data,id,right_line_flag,top_line_flag) {
    d3.json("data/"+ family_tree_data +".json").then(function(treeData) {

        var node_width = 238
            node_height = 90
            treemap_node_height = 150
            node_gap_gen_0 = 140
            node_gap_gen_1 = 400
            religion_svg_dim = 96
            katolikus_sym_scale = 0.016
            evangelikus_sym_scale = 0.030
            reformatus_sym_scale = 0.045
            first_node_y_offset = 5

        var treemap = d3.tree()
            .nodeSize([node_width, treemap_node_height])
    
        var nodes = d3.hierarchy(treeData)

        nodes = treemap(nodes)
        
        //body dimensions
        var body_dim = d3.select("body").node().getBoundingClientRect()

        var right_info_svg = d3.select("#right_area").append("svg")
            .attr("id", "right_svg")
            .attr("height", "100%")
            .attr("width", "100%")

        var main_svg = d3.select("#tree_area").append("svg")
            .attr("id", "main_svg")
            .attr("height", "100%")
            .attr("width", "100%")
        svg_group = main_svg.append("g")
            .attr("id", "svg_group")

        // Get main SVG attributes
        main_svg_dim = getDimensionAttr('main_svg')
        var root_node_init_position_x = (main_svg_dim.width / 2) - (node_width / 2)
        var root_node_init_position_y = first_node_y_offset

        d3.json("data/families.json").then(familiesData => {
            var top_rect_width = 60
            var top_rect_heigth = getDimensionAttr('top_area').height / 1.3
            var top_svg = d3.select("#top_area").append("svg")
                .attr("id", "top_svg")
                .attr("height", "100%")
                .attr("width", "100%")
            var rect = top_svg.selectAll()
                .data(familiesData)
                .enter()
                .append('g')
            rect.append("rect")
                .attr("id", d => d.file)
                .attr("width", top_rect_width)
                .attr("height", top_rect_heigth)
                .attr("fill", d => {
                    if (d.id == id) {
                        return "#e5ffec"
                    } else {
                        return "white"
                    }
                })
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("x", (d,i) => 10 + (top_rect_width + 20) * i)
                .attr("y", getDimensionAttr('top_area').y / 2.6)
                .on("click", family_tree_button)
            rect.append('text')
                .text(d => d.name)
                .attr('x', (d,i) => (top_rect_width + 20) * i + 39)
                .attr('y', top_rect_heigth / 2 + 6)
                .attr('font-size', 10)
                .attr('class', 'text')
                .attr('font-weight', 800)
                .attr('text-anchor', 'middle')
                .style("cursor", "default")
                .on("click", family_tree_button)
                
        })

        //top line
        function topLine(top_line_flag,right_line_flag) {
            css_style_change(top_line_flag,right_line_flag)
            if (top_line_flag) {
                d_button_path = downup
                d_arrow_path = downup_arrow
            } else {
                d_button_path = updown
                d_arrow_path = updown_arrow
            }
            dimension = getDimensionAttr('main_svg')
            top_svg_group = main_svg.append("g")
                .attr("id", "top_svg_group")
            top_svg_group.append("line")
                .attr('id', 'top_line')
                .attr('x1', dimension.x)
                .attr('y1', 0)
                .attr('x2', dimension.width)
                .attr('y2', 0)
                .attr('stroke', 'black')
            top_button_group = top_svg_group.append("g")
                .attr('id', 'top_button_group')
                .on("click", top_button_click)
            top_button_group.append('path')
                .attr('id', 'updown_button')
                .attr('d', function(){return d_button_path})
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', '0.1')
            top_button_group.append('path')
                .attr('id', 'top_updown_arrow')
                .attr('d', function(){return d_arrow_path})
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', '0.1')
            var top_line_width_actual = getDimensionAttr('top_line').width
            var top_line_y_actual = d3.select('#top_line').attr("y1")
            d3.select('#top_button_group').attr('transform', 'translate('+(top_line_width_actual * 0.02)+','+(top_line_y_actual + 1)+') scale(7)')
        }

        //right line
        function rightLine(right_line_flag,top_line_flag) {
            css_style_change(top_line_flag,right_line_flag)
            if (right_line_flag) {
                d_button_path = downup
                d_arrow_path = downup_arrow
            } else {
                d_button_path = updown
                d_arrow_path = updown_arrow
            }
            dimension = getDimensionAttr('main_svg')
            right_svg_group = main_svg.append("g")
                .attr("id", "right_svg_group")
            right_svg_group.append("line")
                .attr('id', 'right_line')
                .attr('x1', dimension.width)
                .attr('y1', dimension.height)
                .attr('x2', dimension.width)
                .attr('y2', 0)
                .attr('stroke', 'black')
            right_button_group = right_svg_group.append("g")
                .attr("id", "right_button_group")
                .on("click", right_button_click)
            right_button_group.append('path')
                .attr('id', 'right_button')
                .attr('d', function(){return d_button_path})
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', '0.1')
             right_button_group.append('path')
                .attr('id', 'right_updown_arrow')
                .attr('d', function(){return d_arrow_path})
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', '0.1')
            var right_line_height_actual = getDimensionAttr('right_line').height
            var right_line_x_actual = d3.select('#right_line').attr("x1")
            d3.select('#right_button_group').attr('transform', 'translate('+(right_line_x_actual-1)+','+(right_line_height_actual*0.02)+') scale(7) rotate(90)')
        }

        rightLine(right_line_flag,top_line_flag)
        topLine(top_line_flag,right_line_flag)
        
        function css_style_change(top_line_flag,right_line_flag) {
            if ((top_line_flag) && (right_line_flag)) {
                document.getElementById('right_area').style.left = "90%"
                document.getElementById('right_area').style.top = "4%"
                document.getElementById('right_area').style.width = "10%"
                document.getElementById('right_area').style.height = "96.9%"
                document.getElementById('tree_area').style.height = "96.9%"
                document.getElementById('tree_area').style.top = "4%"
                document.getElementById('tree_area').style.width = "90%"
            } else if (!(top_line_flag) && (right_line_flag)) {
                document.getElementById('right_area').style.left = "90%"
                document.getElementById('right_area').style.top = "4%"
                document.getElementById('right_area').style.width = "10%"
                document.getElementById('right_area').style.height = "96.9%"
                document.getElementById('tree_area').style.height = "100%"
                document.getElementById('tree_area').style.top = "0%"
                document.getElementById('tree_area').style.width = "90%"
            } else if ((top_line_flag) && !(right_line_flag)){
                document.getElementById('right_area').style.left = "100%"
                document.getElementById('right_area').style.top = "0%"
                document.getElementById('right_area').style.width = "0%"
                document.getElementById('right_area').style.height = "100%"
                document.getElementById('tree_area').style.height = "96.9%"
                document.getElementById('tree_area').style.top = "4%"
                document.getElementById('tree_area').style.width = "100%"
            } else {
                document.getElementById('right_area').style.left = "100%"
                document.getElementById('right_area').style.top = "0%"
                document.getElementById('right_area').style.width = "0%"
                document.getElementById('right_area').style.height = "100%"
                document.getElementById('tree_area').style.height = "100%"
                document.getElementById('tree_area').style.top = "0%"
                document.getElementById('tree_area').style.width = "100%"
            }
        }

        function right_button_click(event) {
            d3.select('#right_svg_group').remove()
            d3.select('#top_svg_group').remove()
            if (right_line_flag) {
                right_line_flag = false
                rightLine(right_line_flag,top_line_flag)
                topLine(top_line_flag,right_line_flag)
            } else {
                right_line_flag = true
                rightLine(right_line_flag,top_line_flag)
                topLine(top_line_flag,right_line_flag)
            }
        }

        function top_button_click(event) {
            d3.select('#top_svg_group').remove()
            d3.select('#right_svg_group').remove()
            if (top_line_flag) {
                top_line_flag = false
                topLine(top_line_flag,right_line_flag)
                rightLine(right_line_flag,top_line_flag)
            } else {
                top_line_flag = true
                topLine(top_line_flag,right_line_flag)
                rightLine(right_line_flag,top_line_flag)
            }
        }

        var zoom = d3.zoom()
        .scaleExtent([0.5, 2.5])
        //.translateExtent([[-3000,0],[3000,3000]])
        .on('zoom', function(event) {
          d3.select("#svg_group")
            .attr("transform", event.transform)
        })

        main_svg.call(zoom).on("dblclick.zoom", null)

        nodes.each(function(d) {
            if (d.data.generation == '0') {
                d.x = root_node_init_position_x
                d.y = root_node_init_position_y
            } else if (d.data.generation == '1') {
                d.x = d.parent.x + node_coeff_a(d.data.gender) * (node_width / 2)
                d.y = treemap_node_height * d.data.generation
            } else {
                d.x = d.parent.x + node_coeff_a(d.data.gender) * (node_width / 2) + node_coeff_a(d.parent.data.gender) * node_coeff_b(d.data.generation)
                d.y = treemap_node_height * d.data.generation
            }
        })

        var included = [1,2,3]

        update(included,"first")

        function update(included,clicked_id) {

            // adds the links between the nodes
            svg_group.selectAll(".link")
                .data(nodes.descendants().slice(1))
                .enter().append("path")
                .filter(d => {
                    return included.includes(Number(d.data.id))
                })
                .attr("class", "link")
                .attr("d", function(d) {
                    if (d.data.generation == '0') {
                        return null
                    } else if (d.data.generation == '1') {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y + 1)
                        + "l" + 0 + "," + -(d.y - node_height - first_node_y_offset)
                    } else if ((d.data.generation % 2 == 0) && (d.data.generation != 0)) {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y)
                        + "l" + 0 + "," + -(treemap_node_height - (node_height / 2 ))
                        + "l" + (link_coeff_b(d.parent.data.gender) * (node_coeff_b(d.data.generation) - (node_width / 2)) - link_coeff_b(d.parent.data.gender) * 0.35) + "," + 0
                    } else {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y + 1)
                        + "l" + 0 + "," + -((treemap_node_height - node_height) / 2)
                        + "l" + (link_coeff_b(d.parent.data.gender) * (node_coeff_b(d.data.generation) + (node_width / 2))) + "," + 0
                        + "l" + 0 + "," + -((treemap_node_height - node_height) / 2)
                    } 
                })
                .attr("id", d => "link"+d.data.id)

            // adds each node as a group
            var node = svg_group.selectAll(".node")
                .data(nodes.descendants())
                .enter().append("g")
                .filter(d => {
                    return included.includes(Number(d.data.id))
                })
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")" 
                })
                .attr("id", d => "node"+d.data.id)
            
            var main_rect = node.append('svg')
              .append('g')
            
            // adds the main rectangle to the node
            main_rect.append("rect")
              .attr("width", node_width)
              .attr("height", node_height)
              .attr("fill", "white")
              .attr("stroke", "black")
              .attr("stroke-width", 1)
              .attr("x", 1)
              .attr("y", 1)
            
            // adds the header rectangle to the node
            main_rect.append("rect")
              .attr("width", node_width)
              .attr("height", node_height * 0.14478)
              .attr("fill", function(d) {
                    if (d.data.gender == 'male') {
                        return '#4472C4'
                    } else {
                        return '#ED7D31'
                    }
              })
              .attr("stroke", "black")
              .attr("stroke-width", 1)
              .attr("x", 1)
              .attr("y", 1)
          
            //name
            main_rect.append('text')
              .text( d => d.data.name )
              .attr('x', ((node_width + 1) / 2))
              .attr('y', node_height / 2 - 8)
              .attr('class', 'text')
              .attr('font-weight', 800)
              .attr('text-anchor', 'middle')
              .style("cursor", "default")
          
            //date
            main_rect.append('text')
                .text( d => d.data.birth_date + ((d.data.death_date != null) ? ' - ' + d.data.death_date : ''))
                .attr('x',((node_width + 1) / 2))
                .attr('y', node_height / 2 + 12)
                .attr('class', 'text')
                .attr('text-anchor', 'middle')
                .style("cursor", "default")
          
            //places
            main_rect.append('text')
                .text( d => d.data.birth_place + ((d.data.death_place != null) ? ' - ' + d.data.death_place : ''))
                .attr('x', ((node_width + 1) / 2))
                .attr('y', node_height / 2 + 32)
                .attr('class', 'text')
                .attr('text-anchor', 'middle')
                .style("cursor", "default")
          
            //id
            main_rect.append('text')
                .text( d => d.data.id + "." + d.data.generation)
                .attr('x', d => {
                    if (d.data.gender === 'male') {
                        return 2
                    } else {
                        return node_width - 1
                    }
                })
                .attr('y', node_height / 2 - 18)
                .attr('font-size', 15)
                .attr('class', 'text')
                .attr('text-anchor', d => {
                    if (d.data.gender === 'male') {
                        return 'start'
                    } else {
                        return 'end'
                    }
                })
                .style("cursor", "default")
            //marriage
            main_rect.append('text')
                .text( d => {
                    if (d.data.gender === 'male') {
                        return d.data.marriage_place
                    } else {
                        return d.data.marriage_date
                    }
                })
                .attr('x', d => {
                    if (d.data.gender === 'male') {
                        return node_width - 2
                    } else {
                        return 2
                    }
                })
                .attr('y', node_height / 2 - 18)
                .attr('class', 'text')
                .attr('font-weight', 100)
                .attr('text-anchor', (d) => {
                    if (d.data.gender === 'male') {
                        return 'end'
                    } else {
                        return 'start'
                    }
                })
                .style("cursor", "default")
            
            //religion    
            var religion_svg = main_rect.append('svg')
                .attr('width', religion_svg_dim)
                .attr('height', religion_svg_dim)
                .attr('x', d => {
                    if (d.data.gender === 'male') {
                      if (d.data.religion === 'katolikus') {
                        return 12
                      }
                      if (d.data.religion === 'reformatus') {
                        return 1
                      }
                      if (d.data.religion === 'evangelikus') {
                        return 5
                      }
                    } else {
                      if (d.data.religion === 'katolikus') {
                        return (node_width - 25)
                      }
                      if (d.data.religion === 'reformatus') {
                        return (node_width - 35)
                      }
                      if (d.data.religion === 'evangelikus') {
                        return (node_width - 32)
                      }
                    }
                })
                .attr('y',  d => {
                    if (d.data.religion === 'katolikus') {
                      return (node_height / 2) - 5
                    }
                    if (d.data.religion === 'reformatus') {
                      return (node_height / 2) - 46
                    }
                    if (d.data.religion === 'evangelikus') {
                      return (node_height / 2) - 9.6
                    }
                })
            
            //katolikus
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'katolikus') {
                        return katolikus_kereszt
                    }
                })
                .attr('fill', 'black')
                .attr('transform', 'translate(0,0) scale('+ katolikus_sym_scale +')')
            
            //evangelikus
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_kor
                    }
                    })
                .attr('fill', 'black')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_virag
                    }
                    })
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', '3.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_path_heart
                    }
                    })
                .attr('fill', 'black')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_kereszt
                    }
                    })
                .attr('fill', 'white')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_vonal_1
                    }
                    })
                .attr('stroke', 'black')
                .attr('stroke-width', '9.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_vonal_2
                    }
                    })
                .attr('stroke', 'black')
                .attr('stroke-width', '9.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_vonal_3
                    }
                    })
                .attr('stroke', 'black')
                .attr('stroke-width', '9.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_vonal_4
                    }
                    })
                .attr('stroke', 'black')
                .attr('stroke-width', '9.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_vonal_5
                    }
                    })
                .attr('stroke', 'black')
                .attr('stroke-width', '9.5')
                .attr('transform', 'translate(0,0) scale('+ evangelikus_sym_scale +')')
                
            //reformatus
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'reformatus') {
                        return reformatus_haromszog
                    }
                    })
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', '30')
                .attr('transform', 'translate(10,60) scale('+ reformatus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'reformatus') {
                        return reformatus_kereszt_1
                    }
                    })
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', '30')
                .attr('transform', 'translate(10,60) scale('+ reformatus_sym_scale +')')
                
            religion_svg.append('path')
                .attr('d', d => {
                    if (d.data.religion === 'reformatus') {
                        return reformatus_kereszt_2
                    }
                    })
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', '30')
                .attr('transform', 'translate(10,60) scale('+ reformatus_sym_scale +')')
                
            //collapse circle
            circle_button_svg = node
                .filter(d => ((d.data.generation > 3 && (d.data.generation % 2 == 0)) || d.data.generation == 1) && d.data.gender == 'male' || d.data.id == 3)
                .append('svg')
                .attr('width', 36)
                .attr('height', 36)
                .attr('x', d => {
                    if (d.data.id == 3) {
                        return node_width + 11
                    } else if (d.data.id == 2) {
                        return -31
                    } else {
                        return node_width - 10
                    }
                })
                .attr('y',  d => {
                    if (d.data.id == 3) {
                        return node_height / 2 - 11
                    } else if (d.data.id == 2) {
                        return node_height / 2 - 11
                    } else {
                        return node_height + 2
                    }
                })
            
            circle_button_svg.append('circle')
                .attr("fill", d => {
                    if (clicked_id == "first") {
                        return "white"
                    } else if (d.data.id == clicked_id) {
                        return "#bababa"
                    } else {
                        return "white"
                    }
                })
                .attr("stroke", "black")
                .attr('stroke-width', 1)
                .attr("cx", 11)
                .attr("cy", 11)
                .attr("r", 10)
                .on("click", click)
        }

        function click(event, d) {
            var current_color = d3.select(this).attr("fill")
            if (current_color == "#bababa") {
                return 0
            }

            var currentId = d.data.id
            var currentGeneration = d.data.generation

            var next_gen = Number(currentGeneration) + 1

            if (Number(currentGeneration) == 1) {
                var last_gen_depth = 5
            } else {
                var last_gen_depth = Number(currentGeneration) + 3
            }

            //If you choose node above the previous one remove nodes below the needed level (last_gen_depth)
            nodes.each(function(d) {
                if (d.data.generation > currentGeneration) {
                    if (included.includes(Number(d.data.id))) {
                        const index = included.indexOf(Number(d.data.id))
                        if (index > -1) {
                            included.splice(index, 1)
                        }
                    }
                }
            })

            //Define all the node id in the needed generation level
            function generationRange(gen) {
                var gen_range_first = Math.pow(2,gen)
                var gen_range_last = Math.pow(2,Number(gen)+1)
                var gen_range =  d3.range(gen_range_first,Number(gen_range_last),1)
                return gen_range
            }

            //Get all the nodes in direct line into an array
            var gen_depth = d3.range(next_gen,last_gen_depth,1)

            function included_array(id){
                var actual_id = [id]
                for (var g of gen_depth) {
                    temp_array = []
                    for (var i of actual_id) {
                        nodes.each(function(d) {
                            if (i == d.data.id) {
                                for (var k of generationRange(g)) {
                                    nodes.each(function(d) {
                                        if (k == d.data.id) {
                                            if (i == d.parent.data.id) {
                                                included.push(k)
                                                temp_array.push(k)
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    }
                    actual_id = []
                    actual_id = temp_array
                    temp_array = []
                }
            }

            included_array(currentId)

            if (currentGeneration > 3) {
                included_array(Number(currentId)+1)
            }

            //Remove all nodes and links for redrawing only the needed ones again
            nodes.each(function(d) {
                d3.select('[id="node'+d.data.id+'"]').remove()
                d3.select('[id="link'+d.data.id+'"]').remove()
            })
            //console.log(included)
            update(included,currentId)
        }

        function family_tree_button(event, d){
            d3.selectAll("svg").remove()
            family_tree(d.file,d.id,right_line_flag,top_line_flag)
        }
    })
}
