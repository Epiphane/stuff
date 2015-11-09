#!/bin/bash

movebook=$(cat ignoreme/.movebook)
if [ $# -lt 1 ]; then
   echo 'usage: scripts/falconRunner.sh teamname...'
   exit 1
fi

for team in $@; do
   node ts/captain.falcon.js $(cat ignoreme/.movebook | jq ".\"$team\"" | xargs) &
done
