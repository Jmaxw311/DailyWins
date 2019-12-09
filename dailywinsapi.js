"strict"

const initDailyWins = function(onDailyWinsApiReady) {

    var apiUrl = 'https://dkyl9z4wmpycr.cloudfront.net/api/';
    
    const getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    };

    var onSuccess = function(data, customHeaders) {
        var apiKey = data['apiKey'];
        var headers = {
            "x-api-key": apiKey
        };
        headers = Object.assign({}, customHeaders, headers);
        var apiGet = function(resource, callback, onFail=function(xhr,status,error){console.log("%s %s %s",xhr,status,error);}) {
            $.ajax({
                url: apiUrl + resource,
                type: 'get',
                headers: headers,
                beforeSend: function(xhr){xhr.setRequestHeader("x-api-key", apiKey);},
                //dataType: 'json',
                success: callback,
                error: onFail
            });
        };

        var apiPost = function(resource, payload, callback) {
            $.ajax({
                url: apiUrl + resource,
                type: 'post',
                headers: {
                    "x-api-key": apiKey
                },
                data: JSON.stringify(payload),
                beforeSend: function(xhr){xhr.setRequestHeader("x-api-key", apiKey);},
                dataType: 'json',
                success: callback,
                error: function(xhr,status,error){console.log("%s %s %s",xhr,status,error);}
            });
        };

        var giveApiKey = function() {
            if (String(window.alert) == "function alert() { [native code] }") {
                alert("Your API key is: " + apiKey);
            } else {
                console.error("Your api key was not displayed because the alert() function may have been modified to intercept the key.");
            }
        }

        onDailyWinsApiReady(apiGet, apiPost, giveApiKey); // run code that uses the api
    };

    var failAuth = function(xhr,status,error) {
        console.log("%s %s %s",xhr,status,error);
        onSuccess({ "apiKey": getUrlParameter('api') });
    }
    
    var code = getUrlParameter('code');
    $.ajax({
        url: apiUrl + 'users/token',
        type: 'post',
        data: JSON.stringify({"code": code }),
        dataType: 'json',
        success: onSuccess,
        error: failAuth
    });
};

const requestAuthorization = function() {
    window.location.replace("https://discordapp.com/api/oauth2/authorize?client_id=648629113132810262&redirect_uri=https%3A%2F%2Fdkyl9z4wmpycr.cloudfront.net%2Findex.html&response_type=code&scope=identify");
}
