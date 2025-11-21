// Constants
const NODE_WIDTH = 238;
const NODE_HEIGHT = 90;
const HIGHLIGHT_GREEN = "#c2e4a0";
const SELECTED_GREEN = "#E1FADD";
const MARGIN_TOP_OPEN = "40px";
const MARGIN_TOP_CLOSED = "0";
const SIDEBAR_WIDTH_OPEN = "250px";
const SIDEBAR_WIDTH_CLOSED = "0";

// Language translations
let currentLanguage = 'hu';

const translations = {
    hu: {
        title: "Magyarázat a használathoz:",
        intro: "A családfa fentről lefelé halad, a kiinduló személytől az egyre távolabbi generációk felé. A fát a nevek mellett/alatt lévő kis körre kattinta lehet tovább bontani. Egér görgővel a fa nagyítható/kicsinyíthető, valamint bal egér gombbal mozgatható bármely irányba.<br>Élő személyek adatait a családfa nem tartalmazza (<b>private</b>) a nevükön kívül. Az elhunytak adatai publikus forrásból származnak (lásd lejjebb).",
        nodeInfo: "Családfán lévő személyek téglalapjában látható információk:",
        nodeDetails: "A téglalapok sarkában (férfinál bal felső; nőnél jobb felső sarok) az adott személy egyedi azonosítója látható, amely egy sorszámból és a pont után a generáció számából áll.<br>A nevek alatt a születési és halálozási helyek és időpontok láthatók.<br>A két személy közötti helyszín és évszám a házasságra vonatkozik.<br>A téglalapban lévő szimbólumok vallási hovatartozást jelölnek(lásd lentebb).<br>Ahol sima kérdőjel <b>?</b> látható, ott az adat még nem ismert. Ahol a kérdőjel zárójelben van <b>(?)</b>, ott az adat ismert (emlékezet, szájhagyomány), de nem bizonyított; nincs hozzá kapcsolható okirat.",
        menuButtons: "Menü gombok:",
        menuDetails: "Bal felső sarokban lévő '<b>V</b>' gombra kattintva lenyílik a családfa választó panel. Kattints arra a személyre, akinek a családfáját látni szeretnéd.<br><br>A jobb felső sarokban lévő '<b><</b>' gombra kattintva kinyílik az információs panel. Ha a fán egy személy téglalapjára kattintasz (zölddel kijelöli), itt jelennek meg a személy testvérei illetve adott esetben a személyre vonatkozó megjegyzés alul.<br>A testvéreknél a születési/halálozási idő/hely látható, kiegészítve a házastárs nevével (ha volt) és a házasság helyével/idejével.<br><br>Bal felül a <b>'Top'</b> gombra kattintva a családfa visszaigazodik a kiinduló pontjára, amennyiben nagyítottunk vagy elmozdítottuk a fát.<br><br>A '<b>Print View</b>'gombra kattintva eltűnnek a fenti és a jobboldali gombok, vonalak. Csak tisztán a családfa marad látható. Az '<b>Escape</b>' billentyűvel lehet visszahozni a normál nézetet.",
        sources: "Források:",
        reformed: "református",
        catholic: "katolikus",
        lutheran: "evangélikus",
        clickPerson: "Kattints egy személyre a családfán"
    },
    en: {
        title: "User Guide:",
        intro: "The family tree flows from top to bottom, from the starting person to more distant generations. The tree can be expanded by clicking the small circle next to/below the names. You can zoom in/out using the mouse wheel and move the tree in any direction by dragging with the left mouse button.<br>The family tree does not contain data for living persons (<b>private</b>) except their names. Data for deceased persons comes from public sources (see below).",
        nodeInfo: "Information displayed in person rectangles:",
        nodeDetails: "In the corner of the rectangles (top left for males; top right for females), the unique identifier of the person is displayed, consisting of a serial number and the generation number after the dot.<br>Below the names, birth and death places and dates are shown.<br>The location and year between two persons refers to marriage.<br>Symbols in the rectangle indicate religious affiliation (see below).<br>Where a plain question mark <b>?</b> is shown, the data is not yet known. Where the question mark is in parentheses <b>(?)</b>, the data is known (memory, oral tradition) but not proven; there is no associated document.",
        menuButtons: "Menu buttons:",
        menuDetails: "Clicking the '<b>V</b>' button in the upper left corner opens the family tree selection panel. Click on the person whose family tree you want to view.<br><br>Clicking the '<b><</b>' button in the upper right corner opens the information panel. If you click on a person's rectangle on the tree (highlighted in green), their siblings and any relevant notes will appear here.<br>For siblings, birth/death time/place is shown, supplemented with the spouse's name (if any) and the place/time of marriage.<br><br>Clicking the <b>'Top'</b> button in the upper left returns the family tree to its starting point if you have zoomed or moved the tree.<br><br>Clicking the '<b>Print View</b>' button hides the top and right side buttons and lines. Only the family tree remains visible. Press the '<b>Escape</b>' key to return to normal view.",
        sources: "Sources:",
        reformed: "Reformed",
        catholic: "Catholic",
        lutheran: "Lutheran",
        clickPerson: "Click on a person in the family tree"
    }
};

// Cached DOM elements
const cachedElements = {
    help: null,
    helpButton: null,
    treeArea: null,
    mySidebar: null,
    myUpbar: null,
    rightOpenButtonDiv: null,
    upOpenButtonDiv: null,
    topButtonDiv: null,
    printButtonDiv: null,
    helpDiv: null,
    rightPanelNameText: null,
    rightPanelSiblingText: null,
    rightPanelCommentText: null
};

function getElement(id) {
    if (!cachedElements[id] || !document.body.contains(cachedElements[id])) {
        cachedElements[id] = document.getElementById(id);
    }
    return cachedElements[id];
}

function help() {
    if (getElement("help") == null ) {

        d3.select('#help_button_id').style("background-color", "white")

        var below_help_button = Number(getDimensionAttr("help_button_id").y) + Number(getDimensionAttr("help_button_id").height)
        var help = d3.select('body')
        var div =  help.append('div')
            .attr("class", "help_box")
            .attr("id", "help")
            .style('left', Number(getDimensionAttr("help_button_id").x) + "px")
            .style('top',  below_help_button + "px")
            .style("background", "white")
            .style("overflow-y", "auto")
            .style("position", "relative")
        div.append("p")
            .attr("class", "add_text")
        
        // Language selector flags
        var flagContainer = d3.select("#help")
            .append("div")
            .style("position", "absolute")
            .style("top", "5px")
            .style("right", "5px")
            .style("display", "flex")
            .style("gap", "8px")
        
        // Hungarian flag SVG
        var flagHu = flagContainer.append("svg")
            .attr("id", "flag_hu")
            .attr("width", "30")
            .attr("height", "20")
            .attr("viewBox", "0 0 30 20")
            .style("cursor", "pointer")
            .style("border", "1px solid #ccc")
            .style("opacity", currentLanguage === 'hu' ? "1" : "0.4")
            .on("click", function() {
                currentLanguage = 'hu';
                updateHelpContent();
                d3.select("#flag_hu").style("opacity", "1");
                d3.select("#flag_en").style("opacity", "0.4");
            })
        flagHu.append("rect").attr("width", "30").attr("height", "6.67").attr("fill", "#CD2A3E")
        flagHu.append("rect").attr("width", "30").attr("height", "6.67").attr("y", "6.67").attr("fill", "#FFFFFF")
        flagHu.append("rect").attr("width", "30").attr("height", "6.66").attr("y", "13.34").attr("fill", "#436F4D")
        
        // British flag SVG
        var flagEn = flagContainer.append("svg")
            .attr("id", "flag_en")
            .attr("width", "30")
            .attr("height", "20")
            .attr("viewBox", "0 0 60 40")
            .style("cursor", "pointer")
            .style("border", "1px solid #ccc")
            .style("opacity", currentLanguage === 'en' ? "1" : "0.4")
            .on("click", function() {
                currentLanguage = 'en';
                updateHelpContent();
                d3.select("#flag_hu").style("opacity", "0.4");
                d3.select("#flag_en").style("opacity", "1");
            })
        flagEn.append("rect").attr("width", "60").attr("height", "40").attr("fill", "#012169")
        flagEn.append("path").attr("d", "M0,0 L60,40 M60,0 L0,40").attr("stroke", "#FFF").attr("stroke-width", "8")
        flagEn.append("path").attr("d", "M0,0 L60,40 M60,0 L0,40").attr("stroke", "#C8102E").attr("stroke-width", "5")
        flagEn.append("path").attr("d", "M30,0 L30,40 M0,20 L60,20").attr("stroke", "#FFF").attr("stroke-width", "13.33")
        flagEn.append("path").attr("d", "M30,0 L30,40 M0,20 L60,20").attr("stroke", "#C8102E").attr("stroke-width", "8")
        
        updateHelpContent();

        document.addEventListener('keydown', (event) => {
            var name = event.key;
            if (name == "Escape") {
                getElement("help").remove()
                d3.select('#help_button_id').style("background-color", HIGHLIGHT_GREEN)
            }
        }, { once: true })

    } else {
        getElement("help").remove()
        d3.select('#help_button_id').style("background-color", HIGHLIGHT_GREEN)
    }

}

function updateHelpContent() {
    const t = translations[currentLanguage];
    
    // Clear existing religion symbols
    const helpElement = getElement("help");
    const svgs = helpElement.querySelectorAll('svg:not(#flag_hu):not(#flag_en)');
    svgs.forEach(svg => svg.remove());
    const textNodes = Array.from(helpElement.childNodes).filter(node => node.nodeType === 3);
    textNodes.forEach(node => node.remove());
    
    helpElement.querySelector("p").innerHTML = 
        "<br><u><b>" + t.title + "</u></b><br><br>" +
        "<div style='text-align: left;'>" + t.intro + "</div><br><br>" +
        "<u><b>" + t.nodeInfo + "</u></b><br>" +
        "<div style='text-align: left;'>" + t.nodeDetails + "</div><br><br>" +
        "<u><b>" + t.menuButtons + "</u></b><br>" +
        "<div style='text-align: left;'>" + t.menuDetails + "</div><br><br>" +
        "<b><u>" + t.sources + "</b></u><br>" +
        "<div style='text-align: left;'><a href='https://archivum.asztrik.hu/'>Kalocsai Főegyházmegyei Levéltár (katolikus / Catholic)</a><br>" +
        "<a href='http://www.oskereso.hu/'>Őskereső (evangélikus / Lutheran)</a><br>" +
        "<a href='https://www.familysearch.org/hu/'>FamilySearch (polgári, vegyes egyházi / civil, mixed religious)</a></div><br><br>";
    
    // Add religion symbols container
    const symbolContainer = document.createElement('div');
    symbolContainer.style.textAlign = 'left';
    symbolContainer.setAttribute('id', 'religion_symbols');
    
    Promise.all([
        d3.xml("images/reformatus.svg"),
        d3.xml("images/katolikus.svg"),
        d3.xml("images/evangelikus.svg")
    ]).then(([reformatus, katolikus, evangelikus]) => {
        symbolContainer.appendChild(reformatus.documentElement);
        symbolContainer.appendChild(document.createTextNode(" " + t.reformed + " "));
        symbolContainer.appendChild(katolikus.documentElement);
        symbolContainer.appendChild(document.createTextNode(" " + t.catholic + " "));
        symbolContainer.appendChild(evangelikus.documentElement);
        symbolContainer.appendChild(document.createTextNode(" " + t.lutheran));
        
        // Remove old symbol container if exists
        const oldContainer = helpElement.querySelector('#religion_symbols');
        if (oldContainer) oldContainer.remove();
        
        helpElement.appendChild(symbolContainer);
    });
}

function printTree() {
    document.body.style.visibility = "hidden";
    getElement("tree_area").style.visibility = "visible";

    document.addEventListener('keydown', (event) => {
        var name = event.key;
        if (name == "Escape") {
            document.body.style.visibility = "visible";
        }
    }, { once: true })
}

function openRightPan() {
    getElement("mySidebar").style.width = SIDEBAR_WIDTH_OPEN;
    getElement("right_open_button_div").style.marginRight = SIDEBAR_WIDTH_OPEN;
    if (getElement("right_panel_name_text").innerHTML == "") {
        getElement("right_panel_sibling_text").innerHTML = translations[currentLanguage].clickPerson
    }
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
}

function closeRightPan() {
    getElement("mySidebar").style.width = SIDEBAR_WIDTH_CLOSED;
    getElement("right_open_button_div").style.marginRight = SIDEBAR_WIDTH_CLOSED;
    d3.select("#right_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
}

function openUpPan() {
    getElement("myUpbar").style.height = MARGIN_TOP_OPEN;
    getElement("up_open_button_div").style.marginTop = MARGIN_TOP_OPEN;
    getElement("tree_area").style.marginTop = MARGIN_TOP_OPEN;
    getElement("top_button_div").style.marginTop = MARGIN_TOP_OPEN;
    getElement("print_button_div").style.marginTop = MARGIN_TOP_OPEN;
    getElement("help_div").style.marginTop = MARGIN_TOP_OPEN;
    getElement("myUpbar").style.zIndex = -1;
    d3.select("#up_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
    d3.select("#top_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
    d3.select("#print_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
    d3.select("#help_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 0)
    if (getElement("help") != null ) {
        d3.select("#help").transition().duration(500).ease(d3.easeLinear).style("opacity", 0)
    }

    d3.json("data/families.json").then(familiesData => {

        var upbar = d3.select('#myUpbar')
            .selectAll('div')
            .data(familiesData)
            .enter()

        var family_choice_div = upbar.append('div')
        family_choice_group = family_choice_div.append("g")
            .attr("class", "add_div")
            .attr("id", d => {return "family_choice_group"+d.id})
            .style('left', (d,i)=> (((i+1) * 70)+(i*70))+"px")
            .style("background", "white")
        family_choice_group.append("p")
            .text(d=> d.name)
            .attr("id", d=> {return "family_choice_text"+d.id})
            .attr("class", "add_text")
            .style('margin-top', d=> {
                return ((30 - getDimensionAttr("family_choice_text"+d.id+"").height)/2 + "px")
            })
        family_choice_group.on("click", family_choice_click)

        var colored_flag = false
        for (let i = 1; i <= familiesData.length; i++) {
            if (d3.select('[id="family_choice_group'+i+'"]').style("background") != "white") {
                colored_flag = true
            }
        }
        if (!colored_flag) {
            d3.select("#family_choice_group1").style("background", HIGHLIGHT_GREEN)
        }
    })
}

function closeUpPan() {
    getElement("myUpbar").style.height = MARGIN_TOP_CLOSED;
    getElement("up_open_button_div").style.marginTop = MARGIN_TOP_CLOSED;
    getElement("top_button_div").style.marginTop = MARGIN_TOP_CLOSED;
    getElement("tree_area").style.marginTop = MARGIN_TOP_CLOSED;
    getElement("print_button_div").style.marginTop = MARGIN_TOP_CLOSED;
    getElement("help_div").style.marginTop = MARGIN_TOP_CLOSED;
    d3.select("#up_open_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    d3.select("#top_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    d3.select("#print_button_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    d3.select("#help_div").transition().duration(1000).ease(d3.easeLinear).style("opacity", 1)
    if (getElement("help") != null ) {
        d3.select("#help").transition().duration(500).ease(d3.easeLinear).style("opacity", 1)
    }
    getElement("myUpbar").style.zIndex = 1;
}

function family_choice_click(event,d) {
    d3.select("body").select('#myUpbar').selectAll("g").style("background", "white")
    d3.select(this).style("background", HIGHLIGHT_GREEN)
    getElement("right_panel_name_text").innerHTML = ""
    getElement("right_panel_sibling_text").innerHTML = ""
    getElement("right_panel_comment_text").innerHTML = ""
    d3.selectAll("svg").remove()
    family_tree(d.file)
}

function to_the_top_button_click() {
    d3.select("#svg_group")
        .transition()
        .duration(750)
        .attr("transform", d3.zoomIdentity)
    d3.zoomTransform(d3.select("#svg_group").node()).x = 0
    d3.zoomTransform(d3.select("#svg_group").node()).y = 0
    d3.zoomTransform(d3.select("#svg_group").node()).k = 1
}

initial_family_tree = "frank_peter"

family_tree(initial_family_tree)

function family_tree(family_tree_data) {
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

        var main_svg = d3.select("#tree_area").append("svg")
            .attr("id", "main_svg")
            .attr("height", "100%")
            .attr("width", "100%")
        svg_group = main_svg.append("g")
            .attr("id", "svg_group")

        zoomed = d3.zoom()
        .scaleExtent([0.5, 2.5])
        //.translateExtent([[-3000,0],[3000,3000]])
        .on('zoom', function(event) {
            d3.select("#svg_group")
                .attr("transform", event.transform)
        })

        main_svg.call(zoomed).on("dblclick.zoom", null)

        // Get main SVG attributes
        main_svg_dim = getDimensionAttr('main_svg')
        var root_node_init_position_x = (main_svg_dim.width / 2) - (node_width / 2)
        var root_node_init_position_y = first_node_y_offset

        nodes.each(function(d) {
            if (Number(d.data.generation) == 0) {
                d.x = root_node_init_position_x
                d.y = root_node_init_position_y
            } else if (Number(d.data.generation) == 1) {
                d.x = d.parent.x + node_coeff_a(d.data.gender) * (node_width / 2)
                d.y = treemap_node_height * Number(d.data.generation)
            } else {
                d.x = d.parent.x + node_coeff_a(d.data.gender) * (node_width / 2) + node_coeff_a(d.parent.data.gender) * node_coeff_b(Number(d.data.generation))
                d.y = treemap_node_height * Number(d.data.generation)
            }
        })

        var included = [1,2,3]
        var init_colored_id = "none"

        update(included,"first",init_colored_id)

        function update(included,clicked_id,colored_id) {

            // adds the links between the nodes
            svg_group.selectAll(".link")
                .data(nodes.descendants().slice(1))
                .enter().append("path")
                .filter(d => {
                    return included.includes(Number(d.data.id))
                })
                .attr("class", "link")
                .attr("d", function(d) {
                    if (Number(d.data.generation) == 0) {
                        return null
                    } else if (Number(d.data.generation) == 1) {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y + 1)
                        + "l" + 0 + "," + -(d.y - node_height - first_node_y_offset)
                    } else if ((Number(d.data.generation) % 2 == 0) && (Number(d.data.generation) != 0)) {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y)
                        + "l" + 0 + "," + -(treemap_node_height - (node_height / 2 ))
                        + "l" + (link_coeff_b(d.parent.data.gender) * (node_coeff_b(Number(d.data.generation)) - (node_width / 2)) - link_coeff_b(d.parent.data.gender) * 0.35) + "," + 0
                    } else {
                        return "m" + (link_coeff_a(d.data.gender,node_width) + d.x) + "," + (d.y + 1)
                        + "l" + 0 + "," + -((treemap_node_height - node_height) / 2)
                        + "l" + (link_coeff_b(d.parent.data.gender) * (node_coeff_b(Number(d.data.generation)) + (node_width / 2))) + "," + 0
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
              .on("click", click_node)
            
            // adds the main rectangle to the node
            main_rect.append("rect")
              .attr("id", d => "big_rect"+d.data.id)
              .attr("width", node_width)
              .attr("height", node_height)
              .attr("fill", function(d) {
                  if (colored_id == d.data.id) {
                    return SELECTED_GREEN
                  } else {
                    return "white"
                  }
              })
              .attr("stroke", "black")
              .attr("stroke-width", 1)
              .attr("x", 1)
              .attr("y", 1)
            
            // adds the header rectangle to the node
            main_rect.append("rect")
              .attr("id", d => "small_rect"+d.data.id)
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
              .style("user-select", "none")
          
            //date
            main_rect.append('text')
                .text( d => d.data.birth_date + ((d.data.death_date != null) ? ' - ' + d.data.death_date : ''))
                .attr('x',((node_width + 1) / 2))
                .attr('y', node_height / 2 + 12)
                .attr('class', 'text')
                .attr('text-anchor', 'middle')
                .style("cursor", "default")
                .style("user-select", "none")
          
            //places
            main_rect.append('text')
                .text( d => d.data.birth_place + ((d.data.death_place != null) ? ' - ' + d.data.death_place : ''))
                .attr('x', ((node_width + 1) / 2))
                .attr('y', node_height / 2 + 32)
                .attr('class', 'text')
                .attr('text-anchor', 'middle')
                .style("cursor", "default")
                .style("user-select", "none")
          
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
                .style("user-select", "none")

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
                .attr('y', node_height / 2 - 21)
                .attr('class', 'text')
                .attr('font-weight', 500)
                .attr('font-size', 13)
                .attr('text-anchor', (d) => {
                    if (d.data.gender === 'male') {
                        return 'end'
                    } else {
                        return 'start'
                    }
                })
                .style("cursor", "default")
                .style("user-select", "none")
            
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
                .attr("id", d => "evangelikus_virag"+d.data.id)
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_virag
                    }
                    })
                .attr('fill', d => {
                    if (d.data.id == colored_id) {
                        return SELECTED_GREEN
                    } else {
                        return 'white'
                    }
                })
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
                .attr("id", d => "evangelikus_kereszt"+d.data.id)
                .attr('d', d => {
                    if (d.data.religion === 'evangelikus') {
                        return evangelikus_kereszt
                    }
                    })
                .attr('fill', d => {
                    if (d.data.id == colored_id) {
                        return SELECTED_GREEN
                    } else {
                        return 'white'
                    }
                })
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
                .filter(d => ((Number(d.data.generation) > 3 && (Number(d.data.generation) % 2 == 0)) || Number(d.data.generation) == 1) && d.data.gender == 'male' || Number(d.data.id) == 3)
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
            var currentGeneration = Number(d.data.generation)

            var next_gen = Number(currentGeneration) + 1

            if (Number(currentGeneration) == 1) {
                var last_gen_depth = 5
            } else {
                var last_gen_depth = Number(currentGeneration) + 3
            }
            
            //keep colored node
            colored_id = "none"
            for (var i of included) {
                nodes.each(function(d) {
                    if (i == d.data.id) {
                        if (d3.select('[id="big_rect'+d.data.id+'"]').attr("fill") == SELECTED_GREEN) {
                            colored_id = d.data.id
                        }
                    }
                })
            }

            //If you choose node above the previous one removes nodes below the needed level (last_gen_depth)
            nodes.each(function(d) {
                if (Number(d.data.generation) > currentGeneration) {
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
            update(included,currentId,colored_id)
        }
        
        function click_node(event, d) {
            var actual_node_fill = d3.select(this).select('[id="big_rect'+d.data.id+'"]').attr("fill")
            nodes.each(function(d) {
                d3.select('[id="big_rect'+d.data.id+'"]').attr("fill", "white")
                d3.select('[id="evangelikus_kereszt'+d.data.id+'"]').attr("fill", "white")
                d3.select('[id="evangelikus_virag'+d.data.id+'"]').attr("fill", "white")
            })
            document.getElementById("right_panel_name_text").innerHTML = ""
            document.getElementById("right_panel_sibling_text").innerHTML = ""
            document.getElementById("right_panel_comment_text").innerHTML = ""
            if (actual_node_fill == "white") {
                d3.select(this).select('[id="big_rect'+d.data.id+'"]').attr("fill", SELECTED_GREEN)
                if (d.data.religion == "evangelikus") {
                    d3.select(this).select('[id="evangelikus_kereszt'+d.data.id+'"]').attr("fill", SELECTED_GREEN)
                    d3.select(this).select('[id="evangelikus_virag'+d.data.id+'"]').attr("fill", SELECTED_GREEN)
                }
                document.getElementById("right_panel_name_text").innerHTML = d.data.name
                document.getElementById("right_panel_comment_text").innerHTML = "<b>Megjegyzés:</b><br>"+d.data.comment+"";
                for (let i = 0; i <= (d.data.siblings.length - 1); i++) {
                    if (i==0) {
                        document.getElementById("right_panel_sibling_text").innerHTML += "<b><u>Testvérek:</u></b><br><br>"
                    }
                    document.getElementById("right_panel_sibling_text").innerHTML += "<b>"+(i+1)+".&nbsp;"+d.data.siblings[i].sibling_name+"</b><br>"
                    if ((d.data.siblings[i].sibling_birth_date != "") || (d.data.siblings[i].sibling_death_date != "")) {
                        document.getElementById("right_panel_sibling_text").innerHTML += ""+d.data.siblings[i].sibling_birth_date+" - "+d.data.siblings[i].sibling_death_date+"<br>";
                    } else {
                        document.getElementById("right_panel_sibling_text").innerHTML += "<br>"
                    }
                    if ((d.data.siblings[i].sibling_birth_place != "") || (d.data.siblings[i].sibling_death_place != "")) {
                        document.getElementById("right_panel_sibling_text").innerHTML += ""+d.data.siblings[i].sibling_birth_place+" - "+d.data.siblings[i].sibling_death_place+"<br>";
                    } else {
                        document.getElementById("right_panel_sibling_text").innerHTML += "<br>"
                    }
                    if (d.data.siblings[i].sibling_spouse_name != "") {
                        if ((d.data.siblings[i].sibling_marriage_place != "") || (d.data.siblings[i].sibling_marriage_place != "")) {
                            document.getElementById("right_panel_sibling_text").innerHTML += ""+d.data.siblings[i].sibling_spouse_name+" ("+d.data.siblings[i].sibling_marriage_place+", "+d.data.siblings[i].sibling_marriage_date+")<br><br>";
                        } else {
                            document.getElementById("right_panel_sibling_text").innerHTML += "<br><br>"
                        }
                    } else {
                        document.getElementById("right_panel_sibling_text").innerHTML += "<br><br>"
                    }
                    
                }
            } else {
                d3.select(this).select('[id="big_rect'+d.data.id+'"]').attr("fill", "white")
                document.getElementById("right_panel_name_text").innerHTML = ""
                document.getElementById("right_panel_sibling_text").innerHTML = "Kattints egy személyre a családfán"
                document.getElementById("right_panel_comment_text").innerHTML = ""
            }

        }
    })
}