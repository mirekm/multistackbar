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
        total = 0,
        paper = this,
        multi = values[0].length, // Total number of stacks in one group
        stacklen = values[0][0].length, // Total number of stack's components
        len = values.length,
        colors = opts.colors || this.g.colors,
        grouplabels = opts.grouplabels,
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

    console.log("Groups: " + len);
    console.log("Total: " + total);
    console.log("Maximum group length: " + multi);
    console.log("Maximum stack length: " + stacklen);

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
        innerwidth = width - 30,
        groupwidth = innerwidth / (len + (len+1)*(gutter/100)),
        grouphgutter = groupwidth * gutter / 100,
        barwidth = groupwidth / (multi + (multi-1)*(gutter/100)),
        barhgutter = barwidth * gutter / 100,
        barvgutter = opts.vgutter == null ? 20 : opts.vgutter,
        stack = [],
        X = x + axiswidth,
        Y = (height - 2 * barvgutter) / total;

    var sum = 0,
        axis = this.set(),
        miny = 0, 
        maxy = total;

    // Add y-axis first
    +opts.axis && axis.push(this.g.axis(x + 15, y + height - gutter, height - 2 * gutter, miny, maxy, opts.axisystep || Math.floor((height - 2 * gutter) / 20), 1));

    for (var i = 0; i < values.length; i++) {
        var group = values[i];
        var startX = X;
        for (var j = 0; j < group.length; j++, sum = 0) {
            var stackd = group[j];
            var stackSum = 0;
            for (var k = 0; k < stackd.length; k++) {
                var h = Math.round(stackd[k] * Y),
                    top = y + height - barvgutter - h,
                    bar = this.g.finger(Math.round(X + barwidth / 2),
                                        sum + top + h, 
                                        barwidth, h, true, type).attr({stroke: "none", fill: colors[k]});
                bars[j].push(bar);
                bar.y = sum + top + h;
                bar.x = Math.round(X + barwidth / 2);
                bar.w = barwidth;
                bar.h = h;
                bar.value = stackd[k];
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
            cvr.bar = {x: bar.x - bar.w / 2, y: bar.y - bar.h, w: barwidth, h: height, value: stackSum};
            X += barwidth;
            X += barhgutter;
        }

        if (grouplabels) {
            var endX;
            axis.push(this.g.finger(startX, height + gutter, endX = X-startX-barhgutter, 1, false, type).attr({stroke: "none", fill: '#BBB'}));
            axis.push(this.g.flag(startX, height + gutter, grouplabels[i] || "", -60).attr({font: "8px"}));
            
        }

        X += grouphgutter;
    }

    covers2.toFront();
    covers.toFront();
    axis.toFront();

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
