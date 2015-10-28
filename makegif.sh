#!/bin/bash

user="$1"

splitGif() {
	gm convert "assets/gif/giphy.gif" +adjoin "$1/%02d.gif"
}

fetchAvatar() {
	userData=$(curl --dump-header headers.txt "https://api.github.com/users/$user")
	avatar_url=$(echo $userData | jq ".avatar_url?")
	echo $avatar_url | xargs -n 1 curl -0 > avatar.jpg
}

fetchAvatar &
mkdir frames
splitGif "frames" &

metadata=$(cat assets/gif/giphy_metadata.json)

startFrame=$(echo "$metadata" | jq '.startingFrameNum')
endFrame=$(echo "$metadata" | jq '.endingFrameNum')
width=$(echo "$metadata" | jq '.width')
height=$(echo "$metadata" | jq '.height')

wait

gm convert avatar.jpg -resize "$widthx$height" avatar_resized.jpg

echo "starting loop"

doFrame() {
	local i=$1
	local pos=$(echo $metadata | jq ".overlayLocs.\"$i\"")
	local number=$(printf "%02d" $i)

	local outFile="frames_out/$number.gif"

	if [ "$pos" == "null" ]; then
		cp "frames/$number.gif" $outFile 
	else
		local x=$(echo $pos | jq ".[0]")
		local y=$(echo $pos | jq ".[1]")

		local x=$(expr $x - $(expr $width / 2))
		local y=$(expr $y - $(expr $height / 2))

		gm convert -page +0+0 "frames/$number.gif" -page "+$x+$y" avatar_resized.jpg -mosaic $outFile
	fi
}

mkdir frames_out

for i in `seq $startFrame $endFrame`;
do
	doFrame "$i" &
done

wait

gm convert -delay 10 frames_out/*.gif animation.gif
