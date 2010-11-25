/*!
 * g.multistack.bar - Multi StackBar Chart, based on Raphaël
 *
 * Copyright (c) 2010 Mirek Mencel (http://mirumee.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
Raphael.fn.g.multistackbar = function (x, y, width, height, values, opts) {
    opts = opts || {};
    var type = {round: "round", sharp: "sharp", soft: "soft"}[opts.type] || "square",
        gutter = parseFloat(opts.gutter || "20%"),
        chart = this.set(),
        bars = this.set(),
        covers = this.set(),
        covers2 = this.set(),
        covers3 = this.set(),
        total = 0,
        paper = this,
        multi = values[0].length, // Total number of stacks in one group
        stacklen = values[0][0].length, // Total number of stack's components
        len = values.length,
        colors = opts.colors || this.g.colors,
        grouplabels = opts.grouplabels,
        stacklabelcolors = opts.stacklabelcolors,
        len = values.length;

    // Who's the most
    var sum = 0;
    for (var i = values.length; i--;) {
        var group = values[i];
        for (var j = group.length; j--;) {
            var stack = group[j];
            for (var k = stack.length; k--; ) {
                sum += stack[k];
            }
            total = Math.max(total, sum);
            sum = 0;
            stacklen = Math.max(stacklen, stack.length);
        }
        multi = Math.max(multi, group.length);
    }

    if(opts.total>0) total = opts.total;

    // Fill the gaps
    for (var i = values.length; i--;) {
        var group = values[i];
        if (group.length < multi) {
            for (var ff0 = multi - group.length; ff0--;) { // Fill up missing elements
                group.push([]);
            }
        }
        for (var j = group.length; j--;) {
            var stack = group[j];
            bars.push(this.set());
            if (stack.length < stacklen) {
                for (var ff1 = stacklen - stack.length; ff1 > 0; ff1--) {
                    stack.push(0);
                }
            }
        }
    }
    // Calculate the gutters (percentage of the bar and group width accordingly)
    var axiswidth = 30, // TODO: fixed y-axis width
        innerwidth = width - axiswidth,
        groupwidth = Math.round(innerwidth / (len + (len-1)*(gutter/100))),
        grouphgutter = Math.round(groupwidth * gutter / 100),
        barwidth = Math.round(groupwidth / (multi + (multi-1)*(gutter/100))),
        barhgutter = Math.round(barwidth * gutter / 100),
        barvgutter = opts.vgutter == null ? 20 : opts.vgutter,
        stack = [],
        X = x + axiswidth,
        Y = (height - 2 * barvgutter) / total,
        bottomy = y + height - barvgutter + barhgutter;

    var sum = 0,
        axis = this.set(),
        miny = 0, 
        maxy = total;

    // y-axis
    +opts.axis && axis.push(this.g.axis(x + 15, y + height - gutter, height - 2 * gutter, miny, maxy, opts.axisystep || Math.floor((height - 2 * gutter) / 20), 1));

    for (var i = 0; i < values.length; i++) {
        var group = values[i];
        var startX = X;
        for (var j = 0; j < group.length; j++, sum = 0) {
            var stackd = group[j],
                stackSum = 0;

            for (var k = 0; k < stackd.length; k++) {
                var h = Math.round(stackd[k] * Y),
                    top = y + height - barvgutter - h,
                    barx = Math.round(X + barwidth / 2),
                    bary = sum + top + h,
                    bar = this.g.finger(barx, bary, 
                                        barwidth, h, 
                                        true, type).attr({stroke: "none", fill: colors[k]});
                bars[j].push(bar);
                bar.y = bary;
                bar.x = barx;
                bar.w = barwidth;
                bar.h = h;
                bar.value = stackd[k];
                bar.label = opts.stackitemlabels[k] || "";
                stack.push(bar);
                // Rollover
                var cover;
                covers.push(cover = this.rect(bar.x - bar.w / 2, sum + top, barwidth, bar.h).attr(this.g.shim));
                cover.bar = bar;
                cover.value = bar.value;
                stackSum += stackd[k];
                sum -= bar.h;
            }
            // Sort it
            for (var s = stack.length; s--;) {
                stack[s].toFront();
            }
            // 'Total' rollover
            var cvr;
            covers2.push(cvr = this.rect(bar.x - bar.w / 2, y, barwidth, height).attr(this.g.shim));
            cvr.bar = {x: bar.x, y: bar.y - bar.h, w: barwidth, h: height, value: stackSum};
            // Optional stack color label
            var boxheight = barwidth - barwidth*0.5,
                boxwidth = Math.min(barwidth * 3/4, 8),
                boxmargin = (barwidth - boxwidth)/2,
                box, boxx, boxy;
            if (stacklabelcolors) {
                //axis.push(box = this.rect(boxx = bar.x - bar.w / 2 + boxmargin, boxy = y + height - barwidth, boxwidth, boxheight).attr({stroke: "none", fill: stacklabelcolors[j] || '#BBB'}));
                axis.push(box = this.g.drop(boxx = bar.x, boxy = bottomy, "", boxwidth, -90).attr({stroke: "none", fill: stacklabelcolors[j] || '#BBB'}));
                box.tip = {x: boxx, y: boxy};
                covers3.push(box);
            }
            if (j < (group.length - 1)) {
                X += barhgutter;
            }
            X += barwidth;
        }
        if (grouplabels) {
            var endX;
            axis.push(this.g.finger(startX, bottomy + boxwidth*2 , endX = X-startX, 1, false, type).attr({stroke: "none", fill: '#BBB'}));
            axis.push(this.g.flag(startX, bottomy + boxwidth*2, grouplabels[i] || "", -60));
        }
        X += grouphgutter;
    }

    covers3.toFront();
    axis.toFront();
    covers2.toFront();
    covers.toFront();

    covers3.mouseover(function() {
        this.flag = paper.g.popup(this.tip.x, this.tip.y, "Test").insertBefore(this);
        //this.animate({scale: 2}, 300);
    }).mouseout(function() {
        //this.flag.animate({opacity: 0}, 300, function () {this.remove();});
    });

    chart.hover = function (fin, fout) {
        //covers2.hide();
        covers.show();
        covers.mouseover(fin).mouseout(fout);
        return this;
    };
    chart.hoverColumn = function (fin, fout) {
        //covers.hide();
        //covers2.show();
        fout = fout || function () {};
        covers2.mouseover(fin).mouseout(fout);
        return this;
    };
    chart.click = function (f) {
        //covers2.hide();
        covers.show();
        covers.click(f);
        return this;
    };
    chart.clickColumn = function (f) {
        covers.hide();
        covers2.show();
        covers2.click(f);
        return this;
    };
    chart.push(bars, covers, covers2, axis);
    chart.bars = bars;
    chart.covers = covers;
    chart.axis = axis;
    return chart;
};
