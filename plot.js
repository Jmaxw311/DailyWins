
// Simple caches to hold data in case of a dropdown form change
var gameTitleMappings = {};
var userIDMappings = {};

var postWins;

const getRelativeDateString = function(daysOffset) {
    var relDate = new Date();
    relDate.setDate(relDate.getUTCDate() + daysOffset);
    var dd = String(relDate.getDate()).padStart(2, '0');
    var mm = String(relDate.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = relDate.getFullYear();
    
    relDate = yyyy + '-' + mm + '-' + dd;
    return relDate
};

var showDailyWinsPlot = function(apiGet,apiPost) {

    const getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return decodeURIComponent(sParameterName[1]);
            }
        }
    };
    
    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

    postWins = function() {
        var gameTitle = String($("select[name='gameSelect'] option:selected").text());
        gameId = gameTitleMappings[gameTitle];
        apiPost('wins', { 
            'gameId': String(gameId), 
            'wins': $('#winsInput').val() }, 
            function(data) { alert("Wins have been posted!\nQuery results may take some time to update."); },
            function(data) { alert("Failed to post wins."); }
        );
    }

    console.log("HERE WE GO!");
    window.chartColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };

    var colorNames = Object.keys(window.chartColors);
    var color = Chart.helpers.color;

    var startDateOffset = -7;
    var earliestDateOffset = startDateOffset;
    var toDateOffset = 0;

    var currentGameId;

    var barChartData = {
        labels: [],
        datasets: []
    }


    //var userIdNum = null;

    var previousQueriedIdentifiers = [];

    // This will be a dictionary of all the game win information gathered
    // so far
    var gameWinsData = {};

    var toDateSelect = document.getElementById("toDateSelect");
    var newUserField = document.getElementById("newusername");
    var addUserButton = document.getElementById("addUser");
    var selectGameMenu = document.getElementById("gameSelect");
    var startDateSelect = document.getElementById("startDateSelect");

    try {
        toDateSelect.max = getRelativeDateString(0);
        toDateSelect.value = getRelativeDateString(0);
        startDateSelect.min = "2019-11-01";
        startDateSelect.max = toDateSelect.value;
        startDateSelect.value = getRelativeDateString(startDateOffset);
        toDateSelect.min = startDateSelect.value;
    } catch (error) {

    }

    if (startDateSelect != null) {
        startDateSelect.onchange = function() {
            var rawDate = startDateSelect.value;
            
            var startDate = new Date(rawDate);
            var today = new Date(getRelativeDateString(1));
            
            var dayDiff = (startDate.getTime() - today.getTime()) / (1000*60*60*24);
            
            startDateOffset = dayDiff;
            
            toDateSelect.min = rawDate;
            
            if(startDateOffset < earliestDateOffset){
                earliestDateOffset = startDateOffset;
                updateEachUser();
            }
            else
                updateBarChart();
        }
    }

    if (toDateSelect != null) {
        toDateSelect.onchange = function() {
            var rawDate = toDateSelect.value;
            var toDate = new Date(rawDate);
            var today = new Date(getRelativeDateString(1));
            
            console.log(toDate.getTime().toString());
            console.log(today.getTime().toString());
            
            var dayDiff = (toDate.getTime() - today.getTime()) / (1000*60*60*24) + 1;
            
            toDateOffset = dayDiff;
            
            startDateSelect.max = rawDate;
            
            updateBarChart();
        }
    }

    var updateEachUser = function() {
        for(var userId in userIDMappings)
            startGetUserGameInfo(userId);
    }

    if (addUserButton != null) {
        addUserButton.onclick = function() {
            var userIdentifier = newUserField.value;
            
            if((userIdentifier in previousQueriedIdentifiers)){
                console.log("User has already been queried");
                return;
            }
            
            var split = userIdentifier.split('#');
            
            if(split.length > 1){
                var username = userIdentifier.split('#')[0];
                var discriminator = userIdentifier.split('#')[1];
                
                startGetUserGameInfoFromIdentity(username, discriminator);
                newUserField.value = '';
            }
            else
                console.log("Invalid user identifier");
        }
    }

    if (selectGameMenu != null) {
        selectGameMenu.onchange = function() {
            currentGameId = gameTitleMappings[selectGameMenu.value];
            updateBarChart();
        }
    }

    var populateGameField = function(idMappings){
        gameTitleMappings = {};
        try {
            selectGameMenu.length = 0;
            
            for(mappingIndex in idMappings.games){
                var mapping = idMappings.games[mappingIndex];
                gameTitleMappings[mapping.gameTitle] = mapping.gameId;
                
                var option = document.createElement('option');
                selectGameMenu.add(option, 0);
                option.text = option.value = mapping.gameTitle;
            }
            
            selectGameMenu.disabled = false;
            currentGameId = gameTitleMappings[selectGameMenu.value];
        } catch (error) {
            console.error(error);
        }
        
        var onAuthFail = function() { 
            //window.location.assign('https://discordapp.com/api/oauth2/authorize?client_id=648629113132810262&redirect_uri=https%3A%2F%2Fdkyl9z4wmpycr.cloudfront.net%2Findex.html&response_type=code&scope=identify'); 
            alert("Please sign in to use this service.");
        };
        apiGet('users/me', receiveMyId, onAuthFail);
    }

    var resetBarChart = function() {
        barChartData.labels = [];
        barChartData.datasets = [];
        
        window.myBar.update();
    }

    // Callback function that uses the value returned by the
    // username API call to get our main user's username
    var addUsername = function(userInfo){
        //userIdentity = username;
        
        console.log("got username: " + userInfo.username);
            
        
        userIDMappings[userInfo.userId] = userInfo.username;
        startGetUserGameInfo(userInfo.userId);
    }

    var startGetUserGameInfoFromIdentity = function(username, discriminator){
        previousQueriedIdentifiers.push(username + "#" + discriminator);
        apiGet('users/id/' + username + '/' + discriminator, addUsername);
    }

    var startGetUserGameInfo = function(userId){
        var queryStartDate = getRelativeDateString(startDateOffset);
        var queryEndDate = getRelativeDateString(toDateOffset);
                
        apiGet('wins/' + userId + '/' + queryStartDate + '/' + queryEndDate, populateUserGameInfo);
    }

    // This essentially restructures the data
    var populateUserGameInfo = function(winsData){
        var userId = winsData.userId;
        
        for(var date in winsData.dailyWins){
            for(var gameId in winsData.dailyWins[date]){
                if (!(gameId in gameWinsData))
                    gameWinsData[gameId] = {};
                    
                if(!(userId in gameWinsData[gameId]))
                    gameWinsData[gameId][userId] = {};
                    
                gameWinsData[gameId][userId][date] = winsData.dailyWins[date][gameId];
            }
        }

        toDateSelect.max = getRelativeDateString(0);
        toDateSelect.value = getRelativeDateString(0);
        startDateSelect.min = "2019-11-01";
        startDateSelect.max = toDateSelect.value;
        startDateSelect.value = getRelativeDateString(startDateOffset);
        toDateSelect.min = startDateSelect.value;
        
        addUserButton.disabled = false;
        updateBarChart();
    }

    var updateBarChart = function() {
        barChartData.labels = [];
        barChartData.datasets = [];
        
        var gameDataSets = {};
        
        for(var i = startDateOffset; i <= toDateOffset; ++i){
            var date = getRelativeDateString(i);
            barChartData.labels.push(date);
            
            for(var userId in gameWinsData[currentGameId]){
                if(!(userId in gameDataSets))
                    gameDataSets[userId] = Array.from('0'.repeat(toDateOffset - startDateOffset + 1));
                    
                if(date in gameWinsData[currentGameId][userId])
                gameDataSets[userId][i - startDateOffset] = gameWinsData[currentGameId][userId][date];
            }
        }
        
        for(var gameData in gameDataSets){
            var colorName = colorNames[barChartData.datasets.length % colorNames.length];
            var dsColor = window.chartColors[colorName];
            barChartData.datasets.push({
                label: userIDMappings[gameData],
                backgroundColor: color(dsColor).alpha(0.5).rgbString(),
                borderColor: dsColor,
                borderWidth: 1,
                data: gameDataSets[gameData]					
            });
        }
        
        window.myBar.update();
    }

    // use apiGet('resource', callback) to use the api

    // Callback function that uses the value returned by the
    // userID API call to get our main user's user ID
    var receiveMyId = function(userInfo) {
        console.log('got userId: ' + userInfo);
        
        try {
            $("#myusername").text(userInfo.username);
        
            avatarUrl = 'https://cdn.discordapp.com/avatars/'
            avatarUrl = avatarUrl + userInfo.userId + '/' + userInfo.avatar + '.png'
            $("#myavatar").attr("src",avatarUrl);
        } catch (error) {
            console.error(error);
        }
        
        addUsername(userInfo);

        var versus = getUrlParameter('versus');
        if (versus !== null && typeof versus == "string") {
            versus = versus.split("+");
            console.log('?versus=' + versus);
            for (var versusi in versus) {
                var otherUser = versus[versusi];
                oname = otherUser.slice(0, -4); // all but last 4 characters
                odisc = otherUser.slice(-4); // last 4 characters
                console.log('versus: ' + oname + '#' + odisc);
                startGetUserGameInfoFromIdentity(oname, odisc); // add user to chart
            }
        }
    };

    var letsGo = function() {

        try {
            var ctx = document.getElementById('barchart').getContext('2d');
            
            window.myBar = new Chart(ctx, {
                type: 'bar',
                data: barChartData,
                options: {
                    responsive: true,
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: "User Wins by Date"
                    }
                }
            });
        } catch (error) {

        }
        
        apiGet('games', populateGameField);
    };

    letsGo();

};
