var topology = require('fully-connected-topology')
var jsonStream = require('duplex-json-stream')
var streamSet = require('stream-set')
var hashToPort = require('hash-to-port')
var register = require('register-multicast-dns')
require('lookup-multicast-dns/global')

var me = process.argv[2]
var others = process.argv.slice(3) 

var t = topology(toAddress(me), others.map(toAddress))
var connections = streamSet()
var id = Math.random()
var seq = 0
var logs = {}

register(me)

t.on('connection', function(connection, peer) {
  console.log('connected to ' + peer)
  var socket = jsonStream(connection) 
  connections.add(socket)

  socket.on('data', function(data) {
    if (logs[data.log] >= data.seq) return;
    logs[data.log] = data.seq
    process.stdout.write(data.username + '>'+ data.message+'\n')

    connections.forEach(function(peer) {
      peer.write(data)
    })
  })
})

process.stdin.on('data', function(data) {
  var next = seq++
  connections.forEach(function (socket) {
    socket.write({
      log: id ,
      seq: seq, 
      username: me,
      message: data.toString().trim()
    })
  })
})

function toAddress(username) {
  return username + '.local:' + hashToPort(username)
}
