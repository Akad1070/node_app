"use strict";

var $container = $('.container'),
	$flashPanel = $('#flashMsg'),
	$listingPanel = $('#listing'),
	$loginPanel = $('#login'),
	$actionPanel = $('#actions').hide(),
	anchor = window.location.hash,
	mapStatusError = {
	    '400' : "Server understood the request, but request content was invalid.",
	    '401' : "Unauthorized Access.",
	    '403' : "Forbidden resource not accessible.",
	    '500' : "Internal Server Error.",
	    '503' : "Service Unavailable."
	}

;


/**
 * Launch an AJAX Request with the def settings
 */
function launchAjaxRequest(_url,_method, _data,cbDone,cbFail){
	// To notify the use that requeest in executing
	
	$flashPanel.html('<div class="flash info"><span>Workin..</span></div>');

	//setFlash('Test Notif Message','info','Notif title');
	var reqAjax =  $.ajax({
			headers: {
				'api-token' : sessionStorage.getItem('token')
			}
			,url  : _url
			,method : _method || 'GET'
			,data : _data
	});

	reqAjax.done(function (data,status) {
		$flashPanel.fadeOut('slow');
		if(cbDone)	cbDone(data);
	});
	reqAjax.fail(function (xhr, textStatus, err) {
		var title = mapStatusError[xhr.status] || 'Unknown error';
		setFlash(xhr.responseText, 'error',title);
		if(cbFail)	cbFail(xhr.responseJSON);
	});

	return reqAjax;
}


/**
 * Send a flashh message showed on the top of the page.
 * Styled based on his status {error,info,success,warm}
 */
function setFlash(msg, status,title) {
	var flash = '<div class="'+status+'">';
	if(title)
		flash += '<h3 class="title">' + title +'</h3>';
	flash += '<p class="content">'+msg+'</p></div>';
	
	$flashPanel.html(flash).show(1500).hide(12000);

}

/**
 * Put in the adress bar the displayed part /#{login, list, logout,add,...}
 */
function setAnchor(currentAnchor,descr){
	window.location.hash = currentAnchor;
	if(descr)
		window.location.hash += '-'+descr;
	//window.history.pushState({},null, currentAnchor);
	//document.title = anchor;
	anchor = currentAnchor;

	if('login' === anchor)
		$('#area').attr('href','/signup').attr('act','signup').text(' Signup');
	else
		$('#area').attr('href','/logout').attr('act','logout').text(' Logout');

}



/**
 * What to display on the homepagee link
 */
function displayHome(){
	setAnchor('home');
	listing('/ziks/by/title',function (){	// GET All ziks for the homepage
		$listingPanel.prepend('<h2>All ziks added</h2>');
	});
}



function displayLoginSignup(url,_cbDone){
	url = url || '/login'  ; // Set a defaul value :: /login
	$loginPanel.show();
	launchAjaxRequest(url,null,null,
		function (html_data,status){ // If the AJAX Request is okay ( Status : 200)
			$loginPanel.html(html_data); // Fill the login div with the html
			setAnchor('login'); // Put in the adress bar the displyead part
			if(_cbDone) _cbDone();
		}
		,function(errJSON) {
		 	if(errJSON && errJSON.name === 'TokenExpiredError'){
				logUserOut();
				setFlash('Your session has expired. Please login again to continue', 'error','Session Expired');
			}
		}
	);
}

function formHandler(e,cb){
	e.preventDefault();
	var formData = {'url':  this.action};
	formData['method'] = this.method;
	// Get the val of the input
	$("input").each(function (index,input) {
		if(input.name){
			if(input.type === 'text' || input.type === 'password' || input.type === 'checkbox' && input.checked)
				formData[input.name] = input.value;
		}
	});

	
	var _fnDone = null, _fnFail = null;
	
	switch (anchor) {
		case 'add':
			_fnDone = function (msg){
				setFlash(msg,'success','New Zik');
			}
			break;
		
		case 'delete' :
			_fnDone = function (msg){
				setFlash(msg,'warn','Deleting Zik');
			}
			break;
			
		case 'update' :
			_fnDone = function (msg){
				setFlash(msg,'success','Updating Zik');
			}
			break;
		case 'login' :
			_fnDone = function (token){
				console.log("Token de %s  ==> %s",formData.pseudo);
				$loginPanel.hide(); // Hide the login div
				if(token){
					sessionStorage.setItem('token',token); // SAve the token in the sessionStorage
					return displayHome();
				}
			}
		default:
			console.log("Acting : Did something :-)");
	}
	



	launchAjaxRequest(formData.url,formData.method,formData,
		function (data,status){ // If the AJAX Request is okay ( Status : 200)
			if(_fnDone) _fnDone();
			listing("/ziks/by/title");	
		}, function(errJSON) {
			console.log('Error Index : '+ errJSON);	
			if(_fnFail) _fnFail(errJSON);
		}
	);
}



function logUserOut(){
	sessionStorage.removeItem('token');
	window.location.href = '/'; // Redirect to the homePage
};


function listing(_url,_cbDone,_cbFail){
	// GET a listing on the left panel
	launchAjaxRequest(_url, null,null
		,function (html_data) {
			$actionPanel.hide(); // Hidden on the action panel
			$listingPanel.show(); // Diplay the listing content
			$listingPanel.html(html_data); // Fill the listing div with the page required
			if(_cbDone) _cbDone();
		}
		, function(data) {
			console.log('Error Index : '+ data);	
			if(_cbFail) _cbFail(data);
		}
	);
}


function acting (_url,_datas){
	console.log('Acting on : ',);

	launchAjaxRequest(_url, null,null
		,function (html_data) {
			$actionPanel.show(); // Diplay the action content on the right
			$actionPanel.html(html_data); // Fill the action div with the page required
		}
		, function(err) {}
	);
	
};




function bindClickOnLinks(e){
	e.preventDefault();
	
	var url = e.target.getAttribute("href"),
		act  = e.target.getAttribute('act'),
		descr = e.target.getAttribute('descr');
		
	// Check first if the user can make this action
	if(act && act != 'signup' && !checkIfAuthUser())
		return displayLoginSignup(); 

	switch (act) {
		case 'home':
			displayHome();
			break;
		case 'login' :
			displayLoginSignup();
			break;
		case 'logout' :
			logUserOut();
			break; 
		case 'signup' :
			displayLoginSignup('/signup')
			break;
		case 'list' :
			listing(url);
			break;
		default: // For the rerst, (add,update,delete)
			acting(act,url);
			
	}

	setAnchor(act);
}

	// No token --> no visit
function checkIfAuthUser(){
	return (sessionStorage && sessionStorage.getItem('token'));
}


$(function() {
	
	$("a").on("click", bindClickOnLinks);
	
	// All click on an link is handled by this fct
	$container.delegate("a", "click", bindClickOnLinks);

	// All form submitted is handled by this fct
	$container.delegate("form", "submit", formHandler);
	
	
	// No token --> no visit
	if(!checkIfAuthUser())
		return displayLoginSignup();

	displayHome();

	


});