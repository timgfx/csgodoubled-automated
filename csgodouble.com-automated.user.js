// ==UserScript==
// @name            csgodouble.com - automated
// @description     An userscript that automates csgodouble.com betting using martingale system.
// @namespace       automated@mole
// @version         1.02
// @author          Mole
// @match           http://www.csgodouble.com/*
// @run-at          document-end
// @grant           none
// ==/UserScript==
/* jshint -W097 */

'use strict';

var debug = false;
var simulation = false;
var base_bet = 5;
var default_color = 'red';

var colors = {
    'green': [0],
    'red': [1, 2, 3, 4, 5, 6, 7],
    'black': [8, 9, 10, 11, 12, 13, 14]
};

var balance = document.getElementById('balance');
var roll_history = document.getElementById('past');

var bet_input = document.getElementById('betAmount');

var bet_buttons = {
    'green': document.getElementById('panel0-0').childNodes[1].childNodes[1],
    'red': document.getElementById('panel1-7').childNodes[1].childNodes[1],
    'black': document.getElementById('panel8-14').childNodes[1].childNodes[1]
};

Array.prototype.equals = function (array) {
    if (!array) {
        return false;
    }

    if (this.length != array.length) {
        return false;
    }

    for (var i = 0, l=this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i])) {
                return false;
            }
        } else if (this[i] != array[i]) {
            return false;
        }
    }
    return true;
};

Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function Automated() {
    var self = this;

    this.running = false;
    this.game = null;

    this.debug = debug;
    this.simulation = simulation;

    this.base_bet = base_bet;
    this.default_color = default_color;
    this.balance = 0;
    this.last_bet = 0;
    this.last_color = null;
    this.last_result = null;
    this.history = [];

    var menu = document.createElement('div');
    menu.innerHTML = '' +
        '<hr>' +
        '<h2>CSGODouble.com Automated <small>by Mole</small></h2>' +
        '<div class="form-group">' +
            '<div class="btn-group">' +
                '<button type="button" class="btn btn-success" id="automated-start" disabled>Start</button>' +
                '<button type="button" class="btn btn-warning" id="automated-stop" disabled>Pause</button>' +
                '<button type="button" class="btn btn-danger" id="automated-abort" disabled>Abort</button>' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<div class="btn-group">' +
                '<button type="button" class="btn btn-default" id="automated-red" ' + (this.default_color === 'red' ? 'disabled' : '') + '>Red</button>' +
                '<button type="button" class="btn btn-default" id="automated-black" ' + (this.default_color === 'black' ? 'disabled' : '') + '>Black</button>' +
            '</div>' +
        '</div>' +
        '<div class="input-group">' +
            '<div class="input-group-addon">Base value</div>' +
            '<input type="number" class="form-control" placeholder="Calculating suggested value..." id="automated-base-bet" disabled>' +
        '</div>' +
        '<div class="checkbox">' +
            '<label><input class="" id="automated-debug" type="checkbox" ' + (this.debug ? 'checked' : '') + '> Debug mode (More details in console)</label>' +
        '</div>' +
        '<div class="checkbox">' +
            '<label><input id="automated-simulation" type="checkbox" ' + (this.simulation ? 'checked' : '') + '> Simulation mode (The value changes depending on rolls, but no coins are actually placed)</label>' +
        '</div>';
    document.getElementsByClassName('well')[1].appendChild(menu);

    this.menu = {
        'start': document.getElementById('automated-start'),
        'stop': document.getElementById('automated-stop'),
        'abort': document.getElementById('automated-abort'),
        'basebet': document.getElementById('automated-base-bet'),
        'debug': document.getElementById('automated-debug'),
        'simulation': document.getElementById('automated-simulation'),
        'red': document.getElementById('automated-red'),
        'black': document.getElementById('automated-black')
    };

    this.updater = setInterval(function() { // Update every 5 - 10 seconds
        if (!self.running) {
            if (self.updateAll() && self.menu.stop.disabled && self.menu.start.disabled) {
                self.menu.start.disabled = false;
                if (self.balance > 1000000) {
                    self.base_bet = Math.floor(self.balance / Math.pow(2, 12));
                } else if (self.balance > 100000) {
                    self.base_bet = Math.floor(self.balance / Math.pow(2, 11));
                } else if (self.balance > 10000) {
                    self.base_bet = Math.floor(self.balance / Math.pow(2, 9));
                } else {
                    self.base_bet = Math.floor(self.balance / Math.pow(2, 6));
                }
                self.menu.basebet.value = self.base_bet;
                self.menu.basebet.disabled = false;
            }
        }
    }, (Math.random() * 5 + 5).toFixed(3) * 1000);

    this.menu.start.onclick = function() {
        self.menu.abort.disabled = false;
        self.menu.stop.disabled = false;
        self.menu.start.disabled = true;
        self.start();
    };

    this.menu.stop.onclick = function() {
        self.menu.abort.disabled = true;
        self.menu.start.disabled = false;
        self.menu.stop.disabled = true;
        self.stop();
    };

    this.menu.abort.onclick = function() {
        self.menu.abort.disabled = true;
        self.menu.start.disabled = false;
        self.menu.stop.disabled = true;
        self.abort();
    };

    this.menu.basebet.onchange = function() {
        var value = parseInt(self.menu.basebet.value);
        if (!isNaN(value)) {
            self.base_bet = value;
        }
    };

    this.menu.debug.onchange = function() {
        self.debug = self.menu.debug.checked;
    };

    this.menu.simulation.onchange = function() {
        self.simulation = self.menu.simulation.checked;
    };

    this.menu.black.onclick = function() {
        self.menu.black.disabled = true;
        self.menu.red.disabled = false;
        self.default_color = 'black';
    };

    this.menu.red.onclick = function() {
        self.menu.black.disabled = false;
        self.menu.red.disabled = true;
        self.default_color = 'red';
    };
}

Automated.prototype.updateBalance = function() {
    this.balance = parseInt(balance.textContent);

    if (isNaN(this.balance)) {
        console.log('[Automated] Error getting current balance!');
        return false;
    }

    if (this.debug) { console.log('[Automated] Balance updated: ' + this.balance); }
    return true;
};

Automated.prototype.updateHistory = function() {
    var self = this;
    this.history = [];

    for (var i = 0; i < roll_history.childNodes.length; i++) {
        var roll = parseInt(roll_history.childNodes[i].textContent);

        if (!isNaN(roll)) {
            if (colors.green.indexOf(roll) !== -1) {
                self.history.push('green');
            } else if (colors.red.indexOf(roll) !== -1) {
                self.history.push('red');
            } else {
                self.history.push('black');
            }
        }
    }

    if (this.debug) { console.log('[Automated] History updated: ' + this.history.map(function(value) { return value; }).join(', ')); }
    return this.history.length === 10;
};

Automated.prototype.updateAll = function() {
    return this.updateBalance() && this.updateHistory();
};

Automated.prototype.bet = function(amount, color) {
    var self = this;
    color = color || this.default_color;

    if (['green', 'red', 'black'].indexOf(color) < 0 || amount > this.balance || amount === 0) {
        console.log('[Automated] Invalid bet!');
        return false;
    }

    bet_input.value = amount;

    setTimeout(function() {
        if (!bet_buttons[color].disabled) {
            var old_balance = self.balance;
            console.log('[Automated] Betting ' + amount + ' on ' + color);
            if (!self.simulation) {
                bet_buttons[color].click();
                var checker = setInterval(function() {
                    if (!bet_buttons[color].disabled) {
                        clearInterval(checker);
                        setTimeout(function() {
                            if (self.updateBalance() && self.balance === old_balance) {
                                console.log('[Automated] Bet rejected, retrying...');
                                self.bet(amount, color);
                            } else {
                                if (self.debug) { console.log('[Automated] Bet accepted!'); }
                                self.last_bet = amount;
                                self.last_color = color;
                            }
                        }, 2500);
                    }
                }, 1000);
            }
        } else {
            console.log('[Automated] Button disabled, retrying...');
            self.bet(amount, color);
        }
    }, (Math.random() * 3 + 2).toFixed(3) * 1000);
};

Automated.prototype.play = function() {
    var self = this;

    if (this.game !== null) {
        if (this.debug) { console.log('[Automated] Tried to reinitialize running game!'); }
        return false;
    }

    this.game = setInterval(function() {
        var history = self.history;
        if (self.updateAll() && !history.equals(self.history)) {
            if (self.last_color === null) {
                self.bet(self.base_bet);
            } else if (self.last_color === self.history[self.history.length - 1]) {
                self.last_result = 'win';
                console.log('[Automated] Win!');
                self.bet(self.base_bet);
            } else {
                self.last_result = 'lose';
                console.log('[Automated] Lose!');
                self.bet(self.last_bet * 2);
            }
        }

    }, (Math.random() * 5 + 5).toFixed(3) * 1000);

    return true;
};

Automated.prototype.start = function() {
    if (this.updateAll()) {
        if (this.last_result === 'lose') {
            this.bet(this.last_bet * 2);
            if (this.play()) {
                this.running = true;
            }
        } else {
            this.bet(this.base_bet);
            if (this.play()) {
                this.running = true;
            }
        }
    }
};

Automated.prototype.stop = function() {
    clearInterval(this.game);
    this.game = null;
    this.running = false;
};

Automated.prototype.abort = function() {
    clearInterval(this.game);
    this.game = null;
    this.running = false;
    this.last_result = 'abort';
};

var automated = new Automated();
