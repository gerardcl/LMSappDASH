$(document).ready( function() {
	var lmsInstance = null, 
		lmsInput = null,
		lmsDashRepresentation = null,
		lmsDashRepresentationList = null;

	var apiURI = 'http://127.0.0.1:8080/api';




    $("#view").load("./app/views/instance.html");

    $( '#view, #form, #connectForm' ).submit(function(event) {
	  	var $form = $( '#connectForm' );
		var	message = { 
			'host' : $form.find( "input[id='host']" ).val(),
			'port' : $form.find( "input[id='port']" ).val()
		};
	    var	uri = apiURI + $form .attr('action');
        $.ajax({
            type: 'POST',
            url: uri,
            data: message,
            dataType: 'json',
        	success : function(msg) {
				if(!msg.error){
					lmsInstance = message;
				    $("#view").load("./app/views/input.html");
				} else {
					lmsInstance = null;
					$("#message").removeClass("hidden");    	
  				    $("#message").html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> '+msg.error);
  				}
			},
			error : function(xhr, msg) {
				lmsInstance = null;
				$("#message").removeClass("hidden");
			    $("#message").html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> ERROR: \
			    ' + msg + ' - ' + xhr.responseText+ ' - No API available');
			}
        })
        console.log(lmsInstance)        
        return false;
	});
});

