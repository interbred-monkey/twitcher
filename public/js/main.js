var socket = io('http://localhost:2843');

$(document).ready(function() {

  socket.emit('connect', ob);

})