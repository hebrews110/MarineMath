
var NUM_COLUMNS = 4;

var numCustomers = 35, numHappy = 0, numSad = 0;

var OFFSET_CUTOFF = 0.75;

var fishes = [ "fish1", "fish2", "fish3", "fish4", "fish5", "fish6", "fish7", "fish8", "fish9", "fish10", "fish11", "fish12", "fish13", "fish14", "seahorse", "weird_octopus" ];
var slimeColumnContainer = document.querySelector("#slimes");
var aimContainer = document.querySelector("#aim-container");
/** @type {HTMLElement} */
var aimerContainer = document.querySelector("#aimer-container");

var questionContainer = document.querySelector(".ice-cream-info");
var answersContainer = document.querySelector(".answers");
var icecreams = document.querySelector(".answers");

var columnDivs = icecreams.querySelectorAll(".ocean-answer");
var rocket = document.querySelector(".rocket");

var fishPictures = Array.from(document.querySelectorAll(".picture-container > img"));

var fishSources = [];

var aimerColumn = 0;

var loadingIndicator = document.querySelector("#loading");

var slimeColumns = [];

for(var i = 0; i < NUM_COLUMNS; i++) {
    slimeColumns[i] = { column: columnDivs[i] };
}

var ie11 = !!window.MSInputMethodContext && !!document.documentMode;

var missileFiring = false;

var missile = document.querySelector(".missile-container");

var operation = getParameterByName("operation");

var currentCorrectAnswer;

var queuedMissile = -1;

var diver = document.querySelector(".swim-row");

var points = 0;

var ocean = document.querySelector(".ocean > img");
var oceanContainer = document.querySelector(".ocean");

var fishTarget = document.querySelector(".target");

Howler.autoSuspend = false;

var incorrectSound = new Howl({
    src: ['incorrect.mp3']
});

var swimSound = new Howl({
    src: ['swim.wav'],
    loop: true,
    autoplay: true
});

var correctSound = new Howl({
    src: ['correct.wav'],
});

var cameraSound = new Howl({
    src: ['camerashutter.mp3']
});

var maxResultSize;

var NUM_QUESTIONS = 18;

var ANIMATION_SPEED = 3000;
var currentQuestion = -1;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

var prevMove = null;

function regenerateColumn(columnIndex, value) {
    columnDivs[columnIndex].innerHTML = value;
}

function factors(number) {
    return Array.from(Array(number + 1), function(_, i) { return i }).filter(function(i) { return number % i === 0 });
}

var firstTry = false;

const factsToFiveFactors = shuffle([
    [ 1, 1 ],
    [ 1, 2 ],
    [ 1, 3 ],
    [ 1, 4 ],
    [ 1, 5 ],
    [ 2, 1 ],
    [ 2, 2 ],
    [ 2, 3 ],
    [ 2, 4 ],
    [ 2, 5 ],
    [ 3, 1 ],
    [ 3, 2 ],
    [ 3, 3 ],
    [ 3, 4 ],
    [ 3, 5 ],
    [ 4, 1 ],
    [ 4, 2 ],
    [ 4, 3 ],
    [ 4, 4 ],
    [ 4, 5 ],
    [ 5, 1 ],
    [ 5, 2 ],
    [ 5, 3 ],
    [ 5, 4 ]
]);
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

document.querySelector("#close-pictures").addEventListener("click", function() {
    document.querySelector("#picture-dialog").style.display = "none";
    answersContainer.style.display = "";
    questionContainer.style.display = "";
});
function newQuestion(pointDelta, filter) {
    if(pointDelta < 0)
        incorrectSound.play();
    else if(pointDelta > 0)
        correctSound.play();
    
    var prom = Promise.resolve();
    if(pointDelta < 0) {
        numSad++;
        fishTarget.style.visibility = "hidden";
    } else if(pointDelta > 0) {
        numHappy++;
        fishTarget.style.visibility = "visible";
        prom = new Promise(function(resolve, reject) {
            function ev() {
                fishTarget.removeEventListener("load", ev);
                resolve();
            }
            function ev2() {
                fishTarget.removeEventListener("error", ev2);
                reject();
            }
            fishTarget.addEventListener("load", ev);
            fishTarget.addEventListener("error", ev2);
            fishTarget.src = "fish/" + fishes[getRandomIntInclusive(0, fishes.length - 1)] + ".svg";
        });
        if(fishSources.indexOf(fishTarget.src) == -1)
            fishSources.push(fishTarget.src);
    }

    var questionSpan = document.querySelector("#question-span");
    questionSpan.innerHTML = pointDelta < 0 ? ("Correct answer: " + currentCorrectAnswer) : "";
    questionSpan.style.color = pointDelta < 0 ? "red" : "";
    answersContainer.style.display = "none";
    icecreams.classList.add("bowls-hidden");
    loadingIndicator.style.display = "inline-block";
    var cb = function() {
        loadingIndicator.style.display = "none";
        diver.classList.add("diver-swims-" + ((!ie11 && Math.random() < 0.5) ? "right" : "left"));
        diver.style.display = "";
        setTimeout(function() {
            currentQuestion++;
            var percent = currentQuestion / NUM_QUESTIONS;
            /*
            if(percent <= 0) {
                document.getElementById("fail-dialog").style.display = "";
                return;
            }
            */
            if(currentQuestion == NUM_QUESTIONS) {
                document.getElementById("win-dialog").style.display = "";
                return;
            }
            
            var correctInitialColumn = getRandomIntInclusive(0, NUM_COLUMNS - 1);
            ocean.style.transform = "translateX(-50%) translateY(-" + (percent * 100) + "%) translateY(-" + ((1-percent) * 100) + "vh)";

            /* MATH CORE BEGIN */
            var firstFactor, secondFactor, symbol;
            if(maxResultSize == 5 && (operation == "add")) {
                var idx = typeof window.currentFiveIndex != 'undefined' ? window.currentFiveIndex : 0;
                firstFactor = factsToFiveFactors[idx][0];
                secondFactor = factsToFiveFactors[idx][1];
                if(Math.random() <= 0.5) {
                    var tmp = firstFactor;
                    firstFactor = secondFactor;
                    secondFactor = tmp;
                }
                currentCorrectAnswer = (operation == "add") ? (firstFactor + secondFactor) : (firstFactor - secondFactor);
                symbol = (operation == "add") ? "&plus;" : "&minus;";
                window.currentFiveIndex = idx + 1;
                if(window.currentFiveIndex >= (factsToFiveFactors.length - 1)) {
                    shuffle(factsToFiveFactors);
                    window.currentFiveIndex = 0;
                }
            } else {
                currentCorrectAnswer = getRandomIntInclusive((operation == "add" && maxResultSize == 10) ? 2 : 1, maxResultSize);
            
                if(operation != null)
                    operation = operation.trim();
                
                if(operation == "add") {
                    symbol = "&plus;";
                    firstFactor = getRandomIntInclusive(1, currentCorrectAnswer - (maxResultSize == 10 ? 1 : 0));
                    secondFactor = currentCorrectAnswer - firstFactor;
                } else if(operation == "subtract") {
                    symbol = "&minus;";
                    currentCorrectAnswer = getRandomIntInclusive(1, maxResultSize);
                    secondFactor = getRandomIntInclusive(1, maxResultSize);
                    firstFactor = currentCorrectAnswer + secondFactor;
                } else if(operation == "multiply") {
                    symbol = "&times;";
                    firstFactor = getRandomIntInclusive(1, maxResultSize);
                    secondFactor = getRandomIntInclusive(1, maxResultSize);
                    currentCorrectAnswer = firstFactor * secondFactor;
                } else if(operation == "divide") {
                    var divisor = getRandomIntInclusive(2, 6);
                    firstFactor = currentCorrectAnswer * divisor;
                    secondFactor = divisor;
                    symbol = "&divide;";
                } else
                    window.alert("Unknown ?operation");    
            }
            
            /* MATH CORE END */

            var incorrectAnswers = [];
            for(var i = 0; i < (NUM_COLUMNS-1); i++) {
                var value;
                do {
                    value = getRandomIntInclusive(0, currentCorrectAnswer + 5);
                } while(incorrectAnswers.indexOf(value) != -1 || value == currentCorrectAnswer);
                incorrectAnswers.push(value);
            }
            for(var i = 0; i < NUM_COLUMNS; i++) {
                regenerateColumn(i, i == correctInitialColumn ? currentCorrectAnswer : incorrectAnswers.pop());
                slimeColumns[i].isCorrect = i == correctInitialColumn;
            }
            firstTry = true;
            if(pointDelta > 0) {
                oceanContainer.classList.add("shutterClick");
                cameraSound.play();
            }
            setTimeout(function() {
                oceanContainer.classList.remove("shutterClick");
                diver.classList.remove("diver-swims-left");
                diver.classList.remove("diver-swims-right");
                diver.style.display = "none";
                icecreams.classList.remove("bowls-hidden");
                
                questionSpan.innerHTML = "" + firstFactor + " " + symbol + " " + secondFactor + " = ?";
                questionSpan.style.color = "";
                if(fishSources.length == fishPictures.length) {
                    console.log(fishSources.length, fishPictures.length);
                    for(var i = 0; i < fishSources.length; i++) {
                        fishPictures[i].src = fishSources[i];
                    }
                    fishSources = [];
                    questionContainer.style.display = "none";
                    document.querySelector("#picture-dialog").style.display = "";
                } else {
                    questionContainer.style.display = "";
                    answersContainer.style.display = "";
                }
            }, pointDelta == 0 ? 0 : (4500/6000)*ANIMATION_SPEED);
        }, pointDelta == 0 ? 0 : (1000/6000)*ANIMATION_SPEED);    
    };
    prom.then(cb, cb);
    
}

function onIceCreamClick(e) {
    var icecream = e.currentTarget;
    var n = parseInt(icecream.textContent);
    newQuestion(n == currentCorrectAnswer ? 5 : -5, icecream.getAttribute("data-filter"));
}

columnDivs.forEach(function(icecream) { icecream.addEventListener("click", onIceCreamClick) });

document.querySelector(".ocean > img").style.transition = "transform 2s linear";

window.addEventListener("load", function() {
    function reqListener () {
        Math.seedrandom(parseInt(this.responseText));
    }
    
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "https://www.random.org/strings/?num=1&len=10&digits=on&unique=on&format=plain&rnd=new");
    oReq.send();
    Swal.fire({
        title: 'Marine Math',
        text: 'Choose a facts category.',
        input: 'select',
        allowOutsideClick: false,
        allowEscapeKey: false,
        inputOptions: {
            '5': 'Facts to 5',
            '10': 'Facts to 10',
        }
    }).then(function(result) {
        let values = result.value;
        maxResultSize = parseInt(values);
        let suffix = ' (to ' + maxResultSize + ')';
        Swal.fire({
            title: 'Marine Math',
            text: 'Choose a game mode.',
            input: 'select',
            allowOutsideClick: false,
            allowEscapeKey: false,
            inputOptions: {
                'add': 'Addition' + suffix,
                'subtract': 'Subtraction' + suffix,
                'multiply': 'Multiplication' + suffix,
                'divide': 'Division' + suffix,
            }
        }).then(function(result) {
            operation = result.value;
            newQuestion(0);
        });
    });
}) 
