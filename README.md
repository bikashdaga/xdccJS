<h1 align="center">xdccJS<br><a href="https://travis-ci.com/github/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a>  <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>
<h5 align="center">a Node.js module to download files from XDCC bots on IRC</h5>

<h4 align="center"><a href="#api-">API</a> | <a href="#command-line-interface-">CLI</a> | <a href="https://github.com/JiPaix/xdccJS/tree/master/examples/">Advanced Examples</a></h4>


## Introduction
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can also be used as a <a href="#command-line-interface-">command-line</a> downloader !
### Features :
- <a href="https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC">Passive DCC</a>
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume partially downloaded files
- Auto-retry on fail
- Pipes!  

## TABLE OF CONTENTS
- [API](#api)
  - [install](#install)
  - [import/require](#import-require)
  - [initialize](#initialize)
  - [download](#download)
    - [jobs](#Jobs)
    - [events](#Events)
    - [use pipes](#Pipes)
  - [IRC connections](#disconnect-reconnect)
- [CLI](#command-line-interface)
  - [install](#install)
  - [options](#options)
  - [FYI](#fyi)

# API :
## Install
`npm i xdccjs`
## Import/require
```js
const XDCC = require('xdccjs').default
// or
import XDCC from 'xdccJS'
```
## Initialize
The simpliest way to start xdccJS is :
```js
let opts = {
  host: 'irc.server.net', // will use default port 6667
  path: 'my/download/folder'
}

const xdccJS = new XDCC(opts)
```
But you can also define a set of options to your preference
```js
const opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS + random)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 2, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and jobs status      - optioanl (default: false)
  randomizeNick: false, // Add random numbers at end of nickname    - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC - optional (default: [5001])
}

const xdccJS = new XDCC(opts)
```
Description of all options avaliable <a href="https://jipaix.github.io/xdccJS/interfaces/params.html">here</a>

## Download

```js
xdccJS.on('ready', () => {
  // every .download() starts a job
  const Job1 = xdccJS.download('XDCC|BLUE', '1-3, 8, 55') // Job#1 is started
  const Job2 = xdccJS.download('XDCC|RED', [1, 3, 10, 20]) // Job#2 is started
  xdccJS.download('XDCC|BLUE', 23) // Job1 is updated
  const Job3 = xdccJS.download('XDCC|RED', '55') // Job2 is updated, Job3 === Job2
})
```
### Jobs
a `Job` is a way to keep track of what's xdccJS is doing :  
When a download is started it's stored as a `Job`, it contains informations about what's is downloaded/downloading/in queue and also provides events for themselves.
```js
const job = xdccJS.download('a-bot', 33)
console.log(job.show())
//=> { name: 'a-bot', queue: 33, now: 0, sucess: [], failed: [] }
```
Running jobs can be shown anytime using `.jobs()` 
```js
console.log(xdccJS.jobs())
//=> CONSOLE OUTPUT
[
  {
    nick: 'bot',
    queue: [ 5, 9, 21 ], // packs in queue
    now: 4, // pack currently downloading
    failures: [ 1, 2 ], // failed packs
    success: [ 'document.pdf', 'audio.wav', 'video.mp4' ] // successfully downloaded files
  },
  {
    nick: 'another-bot',
    queue: [ 3 ],
    now: 2,
    failures: [ ],
    success: [ ]
  }
]
```
### Events
Some events are accessible globally from `xdccJS` and from `Jobs`  

PSA: Using console.log is not recommended, this example is for the sake of showing xdccJS capabilities  
FYI: Setting `verbose` to `true` gives the same results as this example (with colors and better formatting).  

- `on('read')` *[global]* : when xdccJS is ready to download
```js
xdccJS.on('ready', ()=> {
  // download() here
})
```

- `on('downloaded')` *[global+job]* : When a file is downloaded
```js
xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

job.on('downloaded', (fileInfo) => {
  console.log('Job1 has downloaded:' + fileInfo.filePath)
  //=> Job1 has downloaded: /home/user/xdccJS/downloads/myfile.pdf
  console.log(fileInfo)
  //=> { file: 'filename.pdf', filePath: '/home/user/xdccJS/downloads/myfile.pdf', length: 5844849 }
})
```
- `on('done')` *[global+job]* : When a job is done
```js
xdccJS.on('done', (job) => {
  console.log(job.show())
})

job.on('done', (job) => {
  console.log('Job2 is done!')
  console.log(job.show())
})
```
- `on('pipe')` *[global+job]* : When a file is getting piped (see pipe documentation)
```js
xdccJS.on('pipe', (stream, fileInfo) => {
  stream.pipe(somewhere)
  console.log(fileInfo)
  //=> { file: 'filename.pdf', filePath: 'pipe', length: 5844849 }
})

job.on('pipe', (stream, fileInfo) => {
  stream.pipe(somewhere)
})
```
- `on('error')` *[global+job]* : When something goes wrong
```js
xdccJS.on('error', (message) => {
  // message`includes IRC errors and downloads errors 
})

job.on('error', (message) => {
  // message onlmy includes download errors
})
```
#### Disconnect/Reconnect

```js
// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})

// reconnect to the same server :
xdccJS.reconnect()

// change server :
xdccJS.reconnect(
  {
    host: 'irc.newserver.net',
    port: 6669, // optional, default: 6667 
    chan: ['#one', '#two'] // optional
  }
)
```
#### Pipes
To enable piping you must initialize xdccJS with `path` set to false
```js
// This example will start vlc.exe then play the video while it's downloading.
const opts = {
  host: 'irc.server.net',
  path: false, 
}

const xdccJS = new XDCC(opts)

// Start VLC
const { spawn } = require('child_process')
const vlcPath = path.normalize('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe')
const vlc = spawn(vlcPath, ['-'])

xdccJS.on('ready', () => {
  const Job = xdccJS.download('bot', 155)
})

// send data to VLC that plays the file
Job.on('pipe', stream => {
  stream.pipe(vlc.stdin)
})
```
# Command-line Interface
## Install
```bash
npm install xdccjs -g
```  
## Options
```
Options:
  -V, --version              output the version number
  -s, --server <server>      irc server address
  --port <number>            irc server port (default: 6667)
  -b, --bot <botname>        xdcc bot nickname
  -d, --download <packs...>  pack number(s) to download
  -p, --path [path]          download path
  -u, --username <username>  irc username (default: "xdccJS")
  -c, --channel [chan...]    channel to join (without #)
  -r, --retry [number]       number of attempts before skipping pack (default: 0)
  --reverse-port [number]    port used for passive dccs (default: 5001)
  --no-randomize             removes random numbers to nickname
  -w, --wait [number]        wait time (in seconds) before sending download request (default: 0)
  -h, --help                 display help for command
```
### Download 
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|BLUE" --download 1-5,100-105 --path "/home/user/downloads"
```  
Alternatively, if you want to pipe the file just ommit the `--path` option  :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|RED" --download 110 | ffmpeg -i pipe:0 -c:v copy -c:a copy -f flv rtmp://live/mystream
```
## FYI
- `--path` and `--bot` option's values ***MUST*** be either escaped or quoted.
- xdccJS uses `stderr` to print download status informations, `stdout` is ***strictly*** used for download data.
## Documentation :
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">here</a>