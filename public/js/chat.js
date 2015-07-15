var socket = io('http://localhost:2843');

$(function() {

  var ob = {
    channel: "interbred_monkey",
    user: "interbred_monkey"
  }

  socket.emit('chat_connect', ob);

  // setup the chat connections
  $('#chatfrm').on('submit', function(e) {

    e.preventDefault();

    var val = $('#msg').val();

    if (val === "") {

      return false;

    }

    var ob = {
      channel: "interbred_monkey",
      message: val
    }

    socket.emit('chat_message', ob);

    $('#msg').val('');

  })

})

socket.on('chat', function(data) {

  if (typeof data !== 'object' || typeof data.user !== 'object'
      || typeof data.message !== 'string') {

    console.log('Invalid message data returned', data);
    return false;

  }

  if (data.user.color === '#ffffff') {

    data.user.color = "#000000";

  }

  $('#chat').append(
    $('<div/>')
    .append(
      $('<span/>').addClass('user').css('color', data.user.color).text(data.user.username + ": ")
    )
    .append(
      $('<span/>').addClass('msg').text(data.message)
    )
  )
  .scrollTop($('#chat').prop("scrollHeight"));

})

socket.on('stats', function(data) {

  if (data.error !== null) {

    return renderError(data.error);

  }

  return updateStats(data.data);

})

// update the stats on the page
var updateStats = function(params) {

  $('#viewers').text(params.viewers);
  $('#status').removeAttr('class').addClass(params.status.toLowerCase()).text(params.status);
  $('#followers').text(params.followers);
  $('#views').text(params.views);

}

var renderError = function(message) {

  $('.system-message').remove();

  var span = $('<span/>').html(message);
  var div = $('<div/>').addClass('system-message col-md-2 alert alert-danger').html(span);
  $('body').append(div);

  setTimeout(function() {

    $(div).addClass('transparent');

  }, 6000);

}