#!/bin/bash

user="$1"
echo "$user"

gm convert giphy.gif +adjoin "frames/%02d.gif"

userData=$(curl --dump-header headers.txt "https://api.github.com/users/$user")
avatar_url=$(echo $userData | jq ".avatar_url?")
echo "avatar_url: $avatar_url"
curl -k "$avatar_url" > avatar.jpg
echo $avatar_url | xargs -n 1 curl -0 > avatar.jpg

metadata=$(cat giphy_metadata.json)
echo $(echo metadata | jq ".overlayLocs?[5]")

startFrame=$(cat giphy_metadata.json | jq '.startingFrameNum')
endFrame=$(cat giphy_metadata.json | jq '.endingFrameNum')
width=$(cat giphy_metadata.json | jq '.width')
height=$(cat giphy_metadata.json | jq '.height')

echo "startFrame: $startFrame"
echo "endFrame: $endFrame"
echo "width: $width"
echo "height: $height"

gm convert avatar.jpg -resize "$widthx$height" avatar_resized.jpg

for i in `seq $startFrame $endFrame`;
do
	pos=$(echo $metadata | jq ".overlayLocs.\"$i\"")
	number=$(printf "%02d" $i)
	echo "number: $number"
	outFile="frames_out/$number.gif"

	if [ "$pos" == "null" ]; then
		echo "$i is null"
		cp "frames/$number.gif" $outFile
	else
		x=$(echo $pos | jq ".[0]")
		y=$(echo $pos | jq ".[1]")
		echo "x: $x, y: $y"

		x=$(expr $x - $(expr $width / 2))
		y=$(expr $y - $(expr $height / 2))
		echo "adjusted - x: $x, y: $y"

		gm convert -page +0+0 "frames/$number.gif" -page "+$x+$y" avatar_resized.jpg -mosaic $outFile
	fi

done

gm convert -delay 10 frames_out/*.gif animation.gif
