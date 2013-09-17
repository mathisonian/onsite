# Onsite

## Motivation

The goal of this project is to programatically surface reliable, first-hand accounts of news events as they are happening.

## Technique

By applying entity extraction to breaking news headlines one can reliably determine named locations where the most important news events are happening right now. From there latlon bounding coordinates are determined and passed to twitter as a filter for the live firehose stream. 

Onsite takes the stream and determines which tweets are the most trustworthy by applying a variety of filters and associations against known news organizations and media outlets, also taking into account follower count and user description keywords.

## Demo

Rough Demo http://onsite.mathisonian.com

(disclaimer: only expect this to be interesting if a big news story is breaking, stream updates in realtime via websockets)
