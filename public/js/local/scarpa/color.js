/**
 * Created by turner on 7/8/15.
 */
var scarpa = (function (scarpa) {

    scarpa.SVGShaderWithCSSPropertyRGBA = function (rgbaProperty) {

        var pieces = (_.first( (rgbaProperty.split('(')[ 1 ]).split(')') )).split(','),
            shader;

        shader = function () {
            return scarpa.rgba_SVG(parseFloat(pieces[ 0 ]), parseFloat(pieces[ 1 ]), parseFloat(pieces[ 2 ]), parseFloat(pieces[ 3 ]));
        };

        return shader;

    };

    scarpa.randomHSL_SVG = function (min, max) {

        min = scarpa.clamp(min, 0, 360);
        max = scarpa.clamp(max, 0, 360);

        return "hsl(" + Math.floor(scarpa.random(min, max)) + ",100%,50%)";
    };

    scarpa.grey_SVG = function (grey) {

        grey = scarpa.clamp(grey, 0, 255);
        return "rgb(" + grey + "," + grey + "," + grey + ")";
    };

    scarpa.grey_alpha_SVG = function (grey, alpha) {

        grey = scarpa.clamp(grey, 0, 255);
        alpha = scarpa.clamp(alpha, 0.0, 1.0);
        return "rgba(" + grey + "," + grey + "," + grey + "," + alpha + ")";
    };

    scarpa.randomGrey_SVG = function (min, max) {

        var g;

        min = scarpa.clamp(min, 0, 255);
        max = scarpa.clamp(max, 0, 255);
        g = Math.round(scarpa.random(min, max)).toString(10);

        return "rgb(" + g + "," + g + "," + g + ")";
    };

    scarpa.rgb_SVG = function (r, g, b) {

        r = scarpa.clamp(r, 0, 255);
        g = scarpa.clamp(g, 0, 255);
        b = scarpa.clamp(b, 0, 255);
        return "rgb(" + r + "," + g + "," + b + ")";
    };

    scarpa.rgba_SVG = function (r, g, b, a) {

        r = scarpa.clamp(r, 0, 255);
        g = scarpa.clamp(g, 0, 255);
        b = scarpa.clamp(b, 0, 255);
        a = scarpa.clamp(a, 0.0, 1.0);
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    };

    scarpa.randomRGB_SVG = function (min, max) {

        var r, g, b;

        min = scarpa.clamp(min, 0, 255);
        max = scarpa.clamp(max, 0, 255);
        r = Math.round(scarpa.random(min, max)).toString(10);
        g = Math.round(scarpa.random(min, max)).toString(10);
        b = Math.round(scarpa.random(min, max)).toString(10);

        return "rgb(" + r + "," + g + "," + b + ")";
    };

    return scarpa;
})(scarpa || {});
