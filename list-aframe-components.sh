#!/bin/bash
echo '| A-Frame components | file name |'
echo '|--------------------|-----------|'
grep '^[ \t]*AFRAME\.registerComp' *.js{,x} |\
    sed -e 's/^\(.*\):AFRAME\.registerComponent('"'"'\(.*\)'"'"'.*$/|`\2`\t|\t`\1`|/'
