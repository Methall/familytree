function node_coeff_a(gender) {
    if (gender == 'male') {
      return -1
    } else {
      return 1
    } 
  }

function node_coeff_b(generation) {
  if (generation % 2 == 0) {
    return node_gap_gen_0
  } else {
    return node_gap_gen_1
  } 
}

function link_coeff_a(gender,node_width) {
  if (gender == 'male') {
    return node_width + 1
  } else {
    return 1
  } 
}

function link_coeff_b(gender) {
  if (gender == 'male') {
    return 1
  } else {
    return -1
  } 
}

function getDimensionAttr(element_by_id){
  get_element = document.getElementById(element_by_id)
  dim_attr = get_element.getBoundingClientRect()
  return dim_attr
}

function split_name(name) {
  var split_name = name.split(" ")
  return split_name
}

function css_style_change(top_line_flag,right_line_flag) {
  if ((top_line_flag) && (right_line_flag)) {
      document.getElementById('top_area').style.height = "4%"
      document.getElementById('top_area').style.width = "82%"
      document.getElementById('tree_area').style.height = "96%"
      document.getElementById('tree_area').style.top = "4%"
      document.getElementById('tree_area').style.width = "82%"
      document.getElementById('right_area').style.left = "82%"
      document.getElementById('right_area').style.width = "18%"
      css_top_true_right_true_tree_area_width = document.getElementById('tree_area').style.width = "82%"
      css_top_true_right_true_right_area_width = document.getElementById('right_area').style.width = "18%"
  } else if (!(top_line_flag) && (right_line_flag)) {
      document.getElementById('top_area').style.height = "2%"
      document.getElementById('top_area').style.width = "82%"
      document.getElementById('tree_area').style.height = "98%"
      document.getElementById('tree_area').style.top = "2%"
      document.getElementById('tree_area').style.width = "82%"
      document.getElementById('right_area').style.left = "82%"
      document.getElementById('right_area').style.width = "18%"
  } else if ((top_line_flag) && !(right_line_flag)){
      document.getElementById('top_area').style.height = "4%"
      document.getElementById('top_area').style.width = "100%"
      document.getElementById('tree_area').style.height = "96%"
      document.getElementById('tree_area').style.top = "4%"
      document.getElementById('tree_area').style.width = "98.5%"
      document.getElementById('right_area').style.left = "98.5%"
      document.getElementById('right_area').style.width = "98.5%"
  } else {
      document.getElementById('top_area').style.height = "2%"
      document.getElementById('top_area').style.width = "98.5%"
      document.getElementById('tree_area').style.height = "98.5%"
      document.getElementById('tree_area').style.top = "2%"
      document.getElementById('tree_area').style.width = "98.5%"
      document.getElementById('right_area').style.left = "98.5%"
      document.getElementById('right_area').style.width = "98.5%"
  }
}

function wrap_text(text,svg_width,text_length,svg,x_pos,y_pos) {
  var texts = []
  var accum_text = ""
  var i_accum = 0
  for (var i of text) {
      i_accum = i_accum + 1
      accum_text = accum_text.concat(i)
      svg.append("text")
          .attr("id", "comment_text")
          .text(""+accum_text+"")
          .attr('x', x_pos)
          .attr('y', y_pos)
          .attr('class', 'text')
          .attr('text-anchor', 'start')
          .attr('font-size', 12)
      if (i_accum == text_length) {
          texts.push(accum_text)
          d3.select("#comment_text").remove()
          break;
      }
      if (getDimensionAttr('comment_text').width >= (svg_width - 6)) {
          texts.push(accum_text)
          accum_text = ""
      }
      d3.select("#comment_text").remove()
  }
  return texts
}