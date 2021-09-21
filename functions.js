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
