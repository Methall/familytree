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
      document.getElementById('tree_area').style.height = "96.9%"
      document.getElementById('tree_area').style.top = "4%"
      document.getElementById('tree_area').style.width = "82%"
      document.getElementById('right_area').style.left = "82%"
      document.getElementById('right_area').style.top = "4%"
  } else if (!(top_line_flag) && (right_line_flag)) {
      document.getElementById('tree_area').style.height = "100%"
      document.getElementById('tree_area').style.top = "0%"
      document.getElementById('tree_area').style.width = "90%"
      document.getElementById('right_area').style.left = "90%"
      document.getElementById('right_area').style.top = "0%"
  } else if ((top_line_flag) && !(right_line_flag)){
      document.getElementById('tree_area').style.height = "96.9%"
      document.getElementById('tree_area').style.top = "4%"
      document.getElementById('tree_area').style.width = "100%"
      document.getElementById('right_area').style.left = "100%"
      document.getElementById('right_area').style.top = "4%"
  } else {
      document.getElementById('tree_area').style.height = "100%"
      document.getElementById('tree_area').style.top = "0%"
      document.getElementById('tree_area').style.width = "100%"
      document.getElementById('right_area').style.left = "100%"
      document.getElementById('right_area').style.top = "0%"
  }
}