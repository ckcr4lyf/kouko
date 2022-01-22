# 2022-01-22

It seems every second the number of keys goes up by 10-70. Currently, per torrent, the following redis keys are used:

|Redis Key|Type|Contents|
|---------|----|--------|
|[infohash]|Hash|Stores the number of seeders, leechers and completed downloads for a particular torrent|
|[infohash]_seeders|Sorted Set|Stores the [ip:port] tuple as 6 bytes, and the score as the current unix millisecond timestamp|
|[infohash]_leechers|Sorted Set|Stores the [ip:port] tuple as 6 bytes, and the score as the current unix millisecond timestamp|

Currently, on every announce, there is like a 0.01% chance or something to remove all seeders & leechers that are older than 2 hours since last update. However, if someone were to make a few announces and then never trigger the cleanup, these keys would be left behind. 
My current hypothesis is a lot of stale keys are getting left behind and wasting space.

### Possible Solution

Create _another_ sorted set, called `torrents` or something, which will store the `[infohash]` as the value, and the score as the unix millisecond timestamp of the last announce on that infohash. Then, every x minutes, a job can query the sorted set for stuff older than 2 hours, and delete the other three keys that are taking memory (and maybe log space freed!)