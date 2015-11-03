#!/bin/bash

url="$1"

echo "url: $url" >&2

firstTry=$(curl $url)

if [ "$firstTry" == "" ]; then
	secondUrl=$(node parseUrlParam.js $url "d")
	curl $secondUrl
else
	curl $url
fi
