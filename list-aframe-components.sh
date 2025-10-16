#!/bin/bash
grep '^[ \t]*AFRAME\.registerComp' *.js{,x} |\
    sed -e 's/^\(.*\):AFRAME\.registerComponent('"'"'\(.*\)'"'"'.*$/\2\t\t\1/'
