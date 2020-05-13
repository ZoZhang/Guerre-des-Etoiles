/**
 *
 * Projet : un jeux interactif en 2D
 *
 * @author Zhao ZHANG
 * @email  zo.zhang@gmail.com
 */

// gloabl object
let StarWars = {}

// récupere un element par son id ou class.
function $(name) {
    //1-> id, 2-> class
    let type = name.indexOf('#') !== -1 ? 1 : 2;

    name = name.replace(/#|\./ig, '');

    return type === 1 ? document.getElementById(name) : document.getElementsByClassName(name);
}

// récupere une valeur de css d'un element
function getCss(elem, att) {
    try {
        let obj = window.getComputedStyle(elem, null);

        if (obj) {
            return obj.getPropertyValue(att);
        }
    } catch (e) {
        console.log(e);
    }
};

// met une nouvelle valeur de css d'un element
function setCss(elem, name, value) {
    elem.style[name] = value;
}

// création une rectangle
function Rectangle(pos) {
    if (this === window || this === undefined) {
        return new Rectangle(pos);
    } else {
        this.pos = pos;
        this.width  = 0;
        this.height = 0;
        this.DOM = document.createElement('div');
        this.DOM.setAttribute('class',  'rectangle');
    }
    return this;
}

// collision à vérifier avec sa direction
Rectangle.prototype.areIntersecting = function() {

    let x1 = this.pos.x;
    let y1 = this.pos.y;

    let x2 = StarWars.parameters.robot.pos.x;
    let y2 = StarWars.parameters.robot.pos.y;

    let w1 = y1 + this.width;
    let h1 = x1 + this.height;

    let w2 = y2 + StarWars.parameters.robot.rectangle.width;
    let h2 = x2 + StarWars.parameters.robot.rectangle.height;

    let top  = x2 - h1 < 0;
    let bottom  = x1 - h2 < 0;
    let left  = y2 - w1 < 0;
    let right = w2 - y1 > 0;

    return (top || bottom || left || right);
}

// intersection à vérifier avec touts les directions
Rectangle.prototype.inside = function() {

    let x1 = this.pos.x;
    let y1 = this.pos.y;

    let x2 = StarWars.parameters.robot.pos.x;
    let y2 = StarWars.parameters.robot.pos.y;

    let w1 = y1 + this.width;
    let h1 = x1 + this.height;

    let w2 = y2 + StarWars.parameters.robot.rectangle.width;
    let h2 = x2 + StarWars.parameters.robot.rectangle.height;

    let top  = x2 - h1 < 0;
    let bottom  = x1 - h2 < 0;
    let left  = y2 - w1 < 0;
    let right = w2 - y1 > 0;

    return left && right && bottom && top;
}

// position object
function Position(x=0,y=0) {
    if (this === window || this === undefined) {
        return new Position(x,y);
    } else {
        this.x = x;
        this.y = y;
    }
    return this;
}

// ajuste la position
Position.prototype.add = function(pos=Position()) {
    this.x += pos.x;
    this.y += pos.y;
    return this;
};

// sprite object
function Sprite(settings)
{
    if (this == window || this == undefined) {
        return new Sprite(settings);
    } else {

        this.imgPath = settings.imgPath;
        this.insideDOM = settings.insideDOM;
        this.type = settings.type;
        this.point = settings.point;
        this.img = new Image();
        this.img.src = this.imgPath;
        this.img.width = settings.width;
        this.img.height = settings.height;

        // cela permet de mise à jour les données après chargé en dynamique
        let _self = this;
        this.img.onload = function() {
           _self.img.width = this.width;
           _self.img.height = this.height;
        }

        let posX = settings.posX ? settings.posX : 0;
        let posY = settings.posY ? settings.posY : 0;

        this.pos = Position(posX, posY);
        this.rectangle = Rectangle(this.pos);
        this.rectangle.width = this.img.width + 2;
        this.rectangle.height = this.img.height + 2;
        this.rectangle.DOM.setAttribute('class', this.type != 'robot' ? 'rectangle vol' : 'rectangle robot');

        setCss(this.rectangle.DOM, 'top', posX);
        setCss(this.rectangle.DOM, 'left', posY);

        this.rectangle.DOM.append(this.img);
        this.insideDOM.appendChild(this.rectangle.DOM);
    }

    return this;
}

// bouge l'object avec nouvelle position
Sprite.prototype.moveTo = function(elm, pos=Position(), callback) {

    // limit maximum position top/left
    let limit_top = 0;
    let limit_left = 0;
    if (elm.arrowUp && pos.x <= limit_top) {
        pos.x = limit_top;
    } else if (elm.arrowLeft && pos.y <= limit_left) {
        pos.y = limit_left;
    }

    let robot_w = parseInt(getCss(this.img, 'width'));
    let robot_h = parseInt(getCss(this.img, 'height'));

    robot_w = !robot_w || robot_w <= 0 ? this.img.width : robot_w;
    robot_h = !robot_h || robot_h <= 0 ? this.img.height : robot_h;

    let playground_w = parseInt(getCss(this.insideDOM, 'width'));
    let playground_h = parseInt(getCss(this.insideDOM, 'height'));

    // limit maximum position bottom/right
    let limit_height = parseInt(playground_h - robot_h);
    let limit_width = parseInt(playground_w - robot_w);

    if (elm.arrowDown && pos.x > limit_height) {
       pos.x = limit_height;
    } else if (elm.arrowRight && pos.y > limit_width) {
        pos.y = limit_width;
    }

    setCss(this.rectangle.DOM, 'top', pos.x);
    setCss(this.rectangle.DOM, 'left', pos.y);

    elm.arrowUp = false;
    elm.arrowDown = false;
    elm.arrowLeft = false;
    elm.arrowRight = false;

    if (callback) {
        callback({
            elm: this,
            posX: pos.x,
            posY: pos.y,
            type: this.type,
            robot_w: robot_w,
            robot_h: robot_h,
            playground_h: playground_h
        });
    }
}

// calcule nouvelle position et movement
Sprite.prototype.moveRel = function(elm, pos=Position(), callback) {

    // calcule position value
    this.pos.add(pos);

    this.moveTo(elm, this.pos, callback);
}

// remove sprite object sur une table globale
Sprite.prototype.remove = function() {

    for(let index in StarWars.parameters.randomBlockerList) {
        if (index == this.key) {
            delete StarWars.parameters.randomBlockerList[index];
            StarWars.parameters.randomBlockerList.length--;
        }
    }

    return StarWars.parameters.randomBlockerList;
}

// céation un element du Sprite
function Element(settings) {
    if (this == window || this == undefined) {
        return new Element(settings);
    } else {

        Sprite.call(this, settings);

        Object.setPrototypeOf(this, Sprite.prototype);
    }

    return this;
}

// l'exécution après le dom chargé
window.onload = function() {

    StarWars = {
        parameters: {
            playground: $('#playground'),
            description: $('#description'),
            startButton: $('#start'),
            joeurName: $('#joueur'),
            minuteur: $('#minuteur'),
            resetTime: $('#resetTime'),
            niveauBoard: $('#niveau'),
            currentNiveau: $('#currentNiveau'),
            niveau: 1,
            speedBoard: $('#speed'),
            currentSpeed: $('#currentSpeed'),
            speed: 30,
            scoreBoard: $('#scoreBoard'),
            scoreReslut: $('#totalScore'),
            errorMsg: $('#error'),
            totalScore: 0,
            dimunerScore: 0,
            dimunerItemKey: '',
            limiteTime: 1,
            limiteSecond: 59,
            arrowLeft: false,
            arrowRight: false,
            arrowUp: false,
            arrowDown: false,
            run:false,
            imgAttr: [],
            blocker: [],
            blockerSettings:[],
            robotSettings: {},
            success:  '<div id="description"><div class="text resultat">\n' +
                '    <p>Bonjour, ###SURNOM### !</p>\n' +
                '    <p>Vous gangez <em>###POINT###</em> point !</p>\n' +
                '    <p>Vous jouez au niveau <em>###NIVEAU###</em> et la vitesse <em>###VITESEE###</em></p>\n' +
                '    <p>Votre robot</p>\n' +
                '    <p><img src="###ROBOT###"/></p>\n' +
                '</div></div>'
        },

        // initialise les functions
        initialise:function() {

            // met les parametres
            StarWars.parameters.robotSettings = {
                posX: 450,
                posY: 300,
                width:83,
                height:74,
                type: 'robot',
                imgPath: 'images/R2D2.png',
                insideDOM: StarWars.parameters.playground
            };

            StarWars.parameters.blockerSettings = [

                {
                    posX: 60,
                    posY: 25,
                    point: 100,
                    width:128,
                    height:128,
                    type: 'vol',
                    imgPath: 'images/anakin_starfighter.png',
                    insideDOM: StarWars.parameters.playground
                },

                {
                    posX: 60,
                    posY: 60,
                    point: 150,
                    width:128,
                    height:128,
                    type: 'vol',
                    imgPath: 'images/naboo_starfighter.png',
                    insideDOM: StarWars.parameters.playground
                },

                {
                    posX: 60,
                    posY: 150,
                    point: 200,
                    width:128,
                    height:128,
                    type: 'vol',
                    imgPath: 'images/obi_wan_starfighter.png',
                    insideDOM: StarWars.parameters.playground
                },

                {
                    posX: 60,
                    posY: 250,
                    point: 180,
                    width:128,
                    height:128,
                    type: 'vol',
                    imgPath: 'images/x_wing.png',
                    insideDOM: StarWars.parameters.playground
                },

                {
                    posX: 60,
                    posY: 300,
                    point: 200,
                    width:128,
                    height:128,
                    type: 'darthvader',
                    imgPath: 'images/darthvader.png',
                    insideDOM: StarWars.parameters.playground
                },
            ];

            StarWars.parameters.startButton.addEventListener('click', StarWars.startGame);
        },

        // met un compte à rebours
        startMinuteur: function() {

            StarWars.parameters.resetTime.innerText =  StarWars.parameters.limiteTime +"："+StarWars.parameters.limiteSecond;
            StarWars.parameters.minuteur.style.visibility = 'visible';

            if (StarWars.parameters.limiteTime === 0 && StarWars.parameters.limiteSecond <= 59) {
                StarWars.parameters.resetTime.style.color = 'red';
            }

            // termine le jeu
            if(StarWars.parameters.limiteTime === 0 && StarWars.parameters.limiteSecond === 0) {
                StarWars.endGame();
                return;
            } else {
                if(StarWars.parameters.limiteSecond > 0){
                    StarWars.parameters.limiteSecond--;
                } else if(StarWars.parameters.limiteSecond === 0 ){
                    StarWars.parameters.limiteTime--;
                    StarWars.parameters.limiteSecond = 59;
                }
            }
        },

        // commence à jouer le jeu
        startGame: function() {

            StarWars.parameters.run = true;

            // commence à changer le layout du jeu
            StarWars.startLayout();

            // met les robots et les volers, le darthvader
            StarWars.createRobot();

            StarWars.parameters.lastRandomNum = [];
            StarWars.parameters.lastRandomSettings = [];
            StarWars.parameters.randomBlockerList = [];

            StarWars.createRandomBlocker();
            StarWars.parameters.randomBlocker = setInterval(function(){
                StarWars.createRandomBlocker();
            }, 1500);
        },

        // termine le jeu
        endGame: function() {

            StarWars.parameters.run = false;

            setTimeout(function() {

                //success
                StarWars.parameters.playground.innerHTML = StarWars.parameters.success
                    .replace('###SURNOM###', StarWars.parameters.joeurName.value)
                    .replace('###POINT###', StarWars.parameters.totalScore)
                    .replace('###NIVEAU###', StarWars.parameters.niveau)
                    .replace('###VITESEE###', StarWars.parameters.speed)
                    .replace('###ROBOT###', StarWars.parameters.robotSettings.imgPath);

                clearInterval(StarWars.parameters.startMinuteur);
                clearInterval(StarWars.parameters.randomBlocker);
                clearInterval(StarWars.parameters.randomBlockerMove);

                // suppreission touts events intervals
                let interval_id = window.setInterval("", 9999);
                for(let i = 1; i < interval_id; i++) window.clearInterval(i);

            }, 2000);

            window.document.removeEventListener('keydown' ,  StarWars.robotArrowEvent);
        },

        // initialisation l'interface du jeu
        startLayout: function() {

            if (!StarWars.parameters.joeurName.value) {
                StarWars.parameters.errorMsg.innerText = 'Entre votre surnom, s\'il vous plaît';
                return;
            }

            StarWars.parameters.errorMsg.innerText = '';
            StarWars.parameters.joeurName.disabled = true;
            StarWars.parameters.joeurName.style.border = 'none';
            StarWars.parameters.joeurName.style.fontSize = 30;
            StarWars.parameters.joeurName.style.textAlign = 'center';
            StarWars.parameters.startButton.style.display = 'none';
            StarWars.parameters.description.style.display = 'none';
            StarWars.parameters.niveauBoard.style.visibility = 'visible';
            StarWars.parameters.speedBoard.style.visibility = 'visible';
            StarWars.parameters.scoreBoard.style.visibility = 'visible';

            StarWars.updateLayout();

            StarWars.startMinuteur();

            StarWars.parameters.startMinuteur = setInterval(function() {

                StarWars.startMinuteur();

            },1000);

        },

        // actualisation l'interface du jeu
        updateLayout: function() {

            if (StarWars.parameters.limiteTime === 1) {
                if (StarWars.parameters.limiteSecond >= 50) {
                    StarWars.parameters.niveau = 2;
                    StarWars.parameters.speed = 35;
                } else if(StarWars.parameters.limiteSecond >= 30){
                    StarWars.parameters.niveau = 3;
                    StarWars.parameters.speed = 45;
                }
            } else if (StarWars.parameters.limiteTime === 0) {
                if (StarWars.parameters.limiteSecond >= 50) {
                    StarWars.parameters.niveau = 4;
                    StarWars.parameters.speed = 50;
                } else if(StarWars.parameters.limiteSecond <= 30){
                    StarWars.parameters.niveau = 4;
                    StarWars.parameters.speed = 55;
                }
            }

            StarWars.parameters.currentSpeed.innerText = StarWars.parameters.speed;
            StarWars.parameters.currentNiveau.innerText = StarWars.parameters.niveau;
        },

        // création un robot
        createRobot: function() {
            StarWars.parameters.robot = Element(StarWars.parameters.robotSettings);
            window.document.addEventListener('keydown' ,  StarWars.robotArrowEvent);
        },

        // faire les liasons avec les 4 flèches directionnelles
        robotArrowEvent: function(key) {

            let x,y;

            switch(key.code) {

                case 'ArrowUp':

                    x = -20;
                    y = 0;

                    StarWars.parameters.arrowUp = true;
                    break;

                case 'ArrowDown':

                    x = 20;
                    y = 0;

                    StarWars.parameters.arrowDown = true;
                    break;

                case 'ArrowLeft':

                    x = 0;
                    y = -20;

                    StarWars.parameters.arrowLeft = true;
                    break;

                case 'ArrowRight':

                    x = 0;
                    y = 20;

                    StarWars.parameters.arrowRight = true;
                    break;
            }

            StarWars.parameters.robot.moveRel(StarWars.parameters, Position(x, y), StarWars.calculeScore);
        },

        // génération les numéros aléatoires
        getRandomNumber: function(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        },

        // génération les numéros aléatoires mois répetition
        getRandomBlockerIndex: function(min, max) {

            let randomNumber = StarWars.getRandomNumber(min, max);

            if (StarWars.parameters.lastRandomNum.length >= 5) {
                StarWars.parameters.lastRandomNum = [];
            }

            if (StarWars.parameters.lastRandomNum.length && StarWars.parameters.lastRandomNum.indexOf(randomNumber) !== -1) {

                if (max > 100) {
                    min += StarWars.getRandomNumber(10, 128);
                }
                return StarWars.getRandomBlockerIndex(min, max);
            }

            StarWars.parameters.lastRandomNum.push(randomNumber);

            return randomNumber;
        },

        // génération les configuration d'un element aléatoires
        getRandomBlockerSettings: function() {

            let setting = StarWars.parameters.blockerSettings[ StarWars.getRandomBlockerIndex(0, 5) ];

            if (StarWars.parameters.lastRandomSettings.length >= 5) {
                StarWars.parameters.lastRandomSettings = [];
            }

            if (StarWars.parameters.lastRandomSettings.length && StarWars.parameters.lastRandomSettings.indexOf(setting.imgPath) !== -1) {
                return StarWars.getRandomBlockerSettings();
            }

            StarWars.parameters.lastRandomSettings.push(setting.imgPath);

            setting.posY = StarWars.parameters.robot.pos.y + StarWars.getRandomBlockerIndex(10, 200);

            return setting;
        },

        // céation un nouvel element et faire le movement automatiquement
        createRandomBlocker: function() {

            if (!StarWars.parameters.run || StarWars.parameters.randomBlockerList.length > StarWars.parameters.niveau) {
                return;
            }

            // mise à jour le niveau et la vitesse par le temps
            StarWars.updateLayout();

            let element =  Element( StarWars.getRandomBlockerSettings() );
            element.key = 'blocker_' +  Math.random().toString(36).substr(2, 9);

            StarWars.parameters.randomBlockerList[element.key] = element;
            StarWars.parameters.randomBlockerList.length++;

            StarWars.randomBlockerMove();
        },

        // movement automatiquement
        randomBlockerMove: function() {

            if (!StarWars.parameters.randomBlockerList.length) {
                return;
            }

            for(let index in StarWars.parameters.randomBlockerList) {

                let blocker = StarWars.parameters.randomBlockerList[index];

                blocker.moveRel(StarWars.parameters, Position(StarWars.parameters.speed, 0), StarWars.calculeScore);

                StarWars.parameters.randomBlockerMove = setInterval(function() {

                    blocker.moveRel(StarWars.parameters, Position(StarWars.parameters.speed, 0), StarWars.calculeScore);

                }, 300);
            }
        },

        // calcule les notes et suppression les elements
        calculeScore: function(settings) {

            try {

                if (settings.type == 'robot') {
                    return;
                }

                if (!StarWars.parameters.randomBlockerList[settings.elm.key]) {
                    return;
                }

                // caluce dimuner les point et rassure calcue qu'une fois
                if (settings.elm.rectangle.areIntersecting() && settings.elm.rectangle.inside()) {
                    if (settings.elm.key != StarWars.parameters.dimunerItemKey) {
                        StarWars.parameters.dimunerScore += settings.elm.point;
                        StarWars.parameters.dimunerItemKey =  settings.elm.key;
                    }
                }

                // disparaître et met les points
                if (settings.posX >= (settings.playground_h + settings.robot_h + 200)) {

                    // caclue point lorsque le robot ni intersection ni inside.
                    let point = 0;
                    if (!(settings.elm.rectangle.areIntersecting() && settings.elm.rectangle.inside())) {
                        point = settings.elm.point;
                    }

                    if (settings.type == 'darthvader') {
                        StarWars.parameters.dimunerScore += settings.elm.point;
                    }

                    StarWars.parameters.totalScore += point;

                    if (StarWars.parameters.dimunerScore > 0) {
                        StarWars.parameters.totalScore -=  StarWars.parameters.dimunerScore;
                    }

                    StarWars.parameters.dimunerScore = 0;
                    StarWars.parameters.scoreReslut.innerText = StarWars.parameters.totalScore;
                    StarWars.parameters.randomBlockerList[settings.elm.key].remove();
                    settings.elm.rectangle.DOM.parentNode.removeChild(settings.elm.rectangle.DOM);
                }
            } catch (e) {
                console.log(e.message);
            }
        }
    };

    StarWars.initialise();
}
