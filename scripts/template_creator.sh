#!/bin/bash -e

# Only parameter is the generation level number (depth)

## Node template
#{
#    "id": "1",
#    "generation": "0",
#    "name": "",
#    "gender": "",
#    "birth_place": "",
#    "birth_date": "",
#    "death_date": "",
#    "death_place": "",
#    "marriage_date": "",
#    "marriage_place": "",
#    "religion": "",
#    "spouse_id": "",
#    "mother_id": "",
#    "father_id": "",
#    "siblings": [
#    {"sibling_id": "1.0.1","sibling_name": "","sibling_birth_place": "","sibling_birth_date": "", "sibling_death_place": "","sibling_death_date": "","death_place_date": "","sibling_spouse_name": "", "sibling_marriage_place": "", "sibling_marriage_date": ""}
#    ],
#    "children": []
#}

## Sibling template
#{"sibling_id": "1.0.1","sibling_name": "","sibling_birth_place": "","sibling_birth_date": "", "sibling_death_place": "","sibling_death_date": "","death_place_date": "","sibling_spouse_name": "", "sibling_marriage_place": "", "sibling_marriage_date": ""}

if [[ -f ./tree_template.json ]]; then
	rm tree_template.json
fi

generation_number=$1
first_gender=$2

node="{\n\t\"id\": \"\",\n\t\"generation\": \"\",\n\t\"name\": \"\",\n\t\"gender\": \"\",\n\t\"birth_place\": \"\",\n\t\"birth_date\": \"\",\n\t\"death_date\": \"\",\n\t\"death_place\": \"\",\n\t\"marriage_date\": \"\",\n\t\"marriage_place\": \"\",\n\t\"religion\": \"\",\n\t\"spouse_id\": \"\",\n\t\"mother_id\": \"\",\n\t\"father_id\": \"\",\n\t\"siblings\": [],\n\t\"children\": []\n}"

sibling="{\n\t\"id\": \"\",\n\t\"generation\": \"\",\n\t\"name\": \"\",\n\t\"gender\": \"\",\n\t\"birth_place\": \"\",\n\t\"birth_date\": \"\",\n\t\"death_date\": \"\",\n\t\"death_place\": \"\",\n\t\"marriage_date\": \"\",\n\t\"marriage_place\": \"\",\n\t\"religion\": \"\",\n\t\"spouse_id\": \"\",\n\t\"mother_id\": \"\",\n\t\"father_id\": \"\",\n\t\"siblings\": [],\n\t\"children\": []\n}"

for i in $(seq 0 $(($generation_number-1))) # generation level
do
	gen_level_start=$((2 ** $i))
	for k in $(seq $gen_level_start $(((2 ** $(($i+1)))-1))) # person
	do
		if [[ "$i" != 0 ]]; then
			if [[ $(("$k" % 2)) == 0 ]]; then # male
				sed -i '0,/"children": \[\]/s//"children": \['"${node}"'\,replace]/1' tree_template.json
				sed -i '0,/"id": ""/s//"id": "'"${k}"'"/1' tree_template.json
				sed -i '0,/"generation": "",/s//"generation": "'"${i}"'",/1' tree_template.json
				sed -i '0,/"children": \[\]/s//"children": \[hold\]/1' tree_template.json
				sed -i '0,/"gender": ""/s//"gender": "male"/1' tree_template.json
			else # female
				sed -i '0,/replace/s//'"${node}"'/1' tree_template.json
				sed -i '0,/"id": ""/s//"id": "'"${k}"'"/1' tree_template.json
				sed -i '0,/"generation": "",/s//"generation": "'"${i}"'",/1' tree_template.json
				sed -i '0,/"children": \[\]/s//"children": \[hold\]/1' tree_template.json
				sed -i '0,/"gender": ""/s//"gender": "female"/1' tree_template.json
			fi
		else
			echo -e $node | sed 's/"id": ""/"id": "'"${k}"'"/g' | sed 's/"generation": "",/"generation": "'"${i}"'",/g' | sed 's/"gender": ""/"gender": "'"${first_gender}"'"/g' >> tree_template.json
		fi
	done
	sed -i 's/"children": \[hold\]/"children": \[\]/g' tree_template.json
done

