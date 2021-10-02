#!/bin/bash -e

#Help function
Help()
{
	echo
	echo "Usage: build_doxygen.sh [-h] [-i INPUT_FILE_LIST] [-t DOXYFILE_PATH] [-p PROJECT_NAME] [-n PROJECT_NUMBER] [-o OUTPUT_PATH] [-l LAYOUT_PATH] [-c IMAGES_ROOT_PATH]"
	echo 
	echo "Options:"
	echo "  -h   Print this help."
	echo "  -i   Input json file path. (REQUIRED)"
	echo "  -t   Doxygen template file path (Doxyfile). (OPTIONAL; Default: ./Doxyfile)"
	echo "  -p   Project name. (OPTIONAL)"
	echo "  -n   Version of project. (OPTIONAL)"
	echo "  -o   Output file path. (OPTIONAL)"
	echo "  -c   Images root path. (OPTIONAL)"
	echo "  -l   Project layout path. Uses given path to the html_stylesheet.css, header.html, footer.html, project_logo.png, DoxygenLayout.xml (OPTIONAL; Default: ./layout)"
	echo "  -q   QHelpGenerator path. (OPTIONAL)"
}

#Check if file exists function
FILE_EXISTS()
{
	if [[ "$1" != "" ]]; then
		if [[ ! -f "$1" ]]; then
			echo "$1 doesn't exist."
			exit 1
		fi
	fi
}

#Handling options and arguments
while getopts :hi:t:p:n:o:c:l: option; do
	case "${option}" in
		h)
		Help
		exit 0;;
		i) INPUT_FILE_LIST=${OPTARG};;
		t) DOXYFILE_PATH=${OPTARG};;
		p) PROJECT_NAME=${OPTARG};;
		n) PROJECT_NUMBER=${OPTARG};;
		o) OUTPUT_PATH=${OPTARG};;
		c) IMAGES_ROOT_PATH=${OPTARG};;
		l) LAYOUT_PATH=${OPTARG};;
		q) QHELPGENERATOR_PATH=${OPTARG};;
		:)
		echo "Error: -${OPTARG} requires an argument."
		exit 1;;
		*)
		echo "Invalid option: -$OPTARG"
		Help
		exit 1;;
	esac
done
