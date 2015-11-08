#!/bin/bash

node ts/captain.falcon.js $(cat ignoreme/.movebook | jq ".\"$1\"" | xargs)
