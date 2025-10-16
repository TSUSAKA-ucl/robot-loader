#!/bin/bash
for src in src/*.js{,x}
do echo '### eslint: '$src
   pnpx eslint "$src"
done
