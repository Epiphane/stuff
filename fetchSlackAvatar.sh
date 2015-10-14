#!/bin/bash

url="$1"

firstTry=$(curl $url)

if [ "$firstTry" == "" ]; then
	secondUrl=$(node parseUrlParam.js $url "d")
	curl $secondUrl
else
	curl $url
fi