# CSGODouble.com Automated
### Userscript that bets for you! Automates betting on [CSGODouble](http://www.csgodouble.com/).

![Screenshot](http://i.imgur.com/qgoFTHO.png)

## [![Install](https://i.imgur.com/hKHfyWz.png)](https://raw.githubusercontent.com/Aareksio/csgodoubled-automated/master/csgodouble.com-automated.user.js)

## Requirements
Requires [Greasemonkey](http://www.greasespot.net/) on Firefox and [Tampermonkey](http://tampermonkey.net/) on Chrome.

## Is it safe?

It is, check the source - I tried to keep it clean and easy to understand.

## About

The script uses martingale to bet your coins, this means that with every lose it doubles bet value, changing it back to base after win. That, in theory, means you always win base value.

#### Why in theory?

In theory, because the situation takes player with infinite wealth (in our case - `coins`). With every lost bet the value is doubled - let's take `1` as base, here is possible scenario, 16 loses in a row:
```
 1 | Value:     1 | Total amount invested:      1 | Result: Lose
 2 | Value:     2 | Total amount invested:      3 | Result: Lose
 3 | Value:     4 | Total amount invested:      7 | Result: Lose
 4 | Value:     8 | Total amount invested:     15 | Result: Lose
...
12 | Value:  2048 | Total amount invested:   4095 | Result: Lose
...
16 | Value: 32768 | Total amount invested:  65535 | Result: Lose
17 | Value: 65536 | Total amount invested: 131071 | Result: Win
```
As you can see, it took `132071` coins just to get base `1` coin back.

#### Why don't you code 'rainbow protection' then?

If you ask such question, you don't even understand what is so-called `rainbow protection` and why it is bullshit.

Let me show you another example, we are betting on `red`, here is current result history:
```
red, red, black, red, green, black, black, black, black, black
```
What should the script do in that situation - keep with red, switch to black?
The answer is - whatever it does the winning chance is exactly the same.
You should say something like - "Why?! You can see many streaks on the site, it is impossible!".
Well, it is possible, the site uses a system which chose `random` (at least very close to be random) number.

Let's simplify it to a coin toss (which is pretty similar) - we have 50% chance for heads, 50% chance for tails*.
We start tossing. Heads. What are the chances, after the first toss? 50/50! Tossing it again (and again...) won't change the chance a bit.

#### Does that mean I may lose everything in one unlucky streak?

Yes. That is what I'm trying to say. That also means you will eventually *lose everything* using this algorithm (algorithm, not the script itself, applies to any other script using this system).
To cheer you up a bit I can say that within gambling's very nature lays the possiblity of losing everything. All you can do is to play safe and use only funds you can afford to lose!

#### Why would I play the game if i can lose everything?

Because that doesn't mean you may not earn anything - calculate base value depending on your balance and risk you want to take.

**How to calculate**

``floor(balance / 2^(loses_in_a_row_you_want_to_cover + 1))``

Examples:
```
Balance: 10000
Safety: Medium, want to be safe even if the streak is 8 turns long
Base value: floor(10000/2^9) = 19
```
```
Balance: 250000
Safety: High-medium, want to be safe with 12 turns long streaks
Base value: floor(250000/2^13) = 30
```
```
Balance: 5000000
Safety: High, you are risking a lot of money, you want to be safe with 15 turns long streaks
Base value: floor(5000000/2^16) = 76
```

#### Okay, I think I understand... But why are streaks so common?

Remember, as the site uses computer randomness, it may feel strange, but that os how it works.
As a human you wouldn't except more than X `reds` in a row, because you are counting 10, 20, maybe 100 rolls the outcome should give equal chances for both colors, but keep in mind that machine counts *thousands* more times rolls than you can - if in your calculations (100 rolls) `reds` may be chosen 2 times in a row, what is wrong with 20 `reds` streak in thousands of rolls?
That is why people may call the site rigged, but it is not (I'm not defending the site, just the algorithm itself).


*[They say it is not, but we don't care, right?](https://www.youtube.com/watch?v=AYnJv68T3MM)
