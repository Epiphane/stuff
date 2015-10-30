#!/bin/bash

slackAvatarUrl="$1"

temp=$(mktemp -d)
echo "$temp"

splitGif() {
	gm convert "assets/gif/giphy.gif" +adjoin "$1/%02d.gif"
}

fetchGithubAvatar() {
	user="$1"

	userData=$(curl --dump-header headers.txt "https://api.github.com/users/$user")
	avatar_url=$(echo $userData | jq ".avatar_url?")
	echo $avatar_url | xargs -n 1 curl -0 > $temp/avatar.jpg
}

fetchAvatar() {
	./fetchSlackAvatar.sh $slackAvatarUrl > $temp/avatar.jpg
}

fetchAvatar &
mkdir $temp/frames
splitGif "$temp/frames" &

metadata=$(cat assets/gif/giphy_metadata.json)

startFrame=$(echo "$metadata" | jq '.startingFrameNum')
endFrame=$(echo "$metadata" | jq '.endingFrameNum')
width=$(echo "$metadata" | jq '.width')
height=$(echo "$metadata" | jq '.height')

wait

gm convert $temp/avatar.jpg -resize "$widthx$height" $temp/avatar_resized.jpg
mkdir $temp/frames_out

doFrame() {
	local i=$1
	local pos=$(echo $metadata | jq ".overlayLocs.\"$i\"")
	local number=$(printf "%02d" $i)

	local outFile="$temp/frames_out/$number.gif"

	if [ "$pos" == "null" ]; then
		cp "$temp/frames/$number.gif" $outFile 
	else
		local x=$(echo $pos | jq ".[0]")
		local y=$(echo $pos | jq ".[1]")

		local x=$(expr $x - $(expr $width / 2))
		local y=$(expr $y - $(expr $height / 2))

		gm convert -page +0+0 "$temp/frames/$number.gif" -page "+$x+$y" $temp/avatar_resized.jpg -mosaic $outFile
	fi
}

for i in `seq $startFrame $endFrame`;
do
	doFrame "$i" &
done

wait

gm convert -delay 10 -loop 0 -depth 4 -resize '300x200>'  $temp/frames_out/*.gif $temp/animation.gif
gifsicle -O3 --colors 256 < $temp/animation.gif > $temp/better.gif
