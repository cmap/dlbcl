/**
 * Created by turner on 7/8/15.
 */
var scarpa = (function (scarpa) {

    scarpa.d3NodeBounds = function(node) {

        var bounds,
            bb = {};

        bounds = node.getBoundingClientRect();
        bb[ "left" ] = Math.floor(bounds.left);
        bb[ "right" ] = Math.floor(bounds.right);
        bb[ "top" ] = Math.floor(bounds.top);
        bb[ "bottom" ] = Math.floor(bounds.bottom);
        bb[ "width" ] = Math.floor(bounds.width);
        bb[ "height" ] = Math.floor(bounds.height);

        return bb;
    };

    scarpa.lerp = function (interpolant0to1, from, to) {
        return (1.0 - interpolant0to1) * from + interpolant0to1 * to;
    };

    // Returns a random number between min (inclusive) and max (exclusive)
    scarpa.random = function (min, max) {
        return Math.random() * (max - min) + min;
    };

    scarpa.clamp = function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    scarpa.numberFormatter = function (rawNumber) {

        var dec = String(rawNumber).split(/[.,]/),
            sep = ',',
            decsep = '.';

        return dec[0].split('').reverse().reduce(function (prev, now, i) {
                return i % 3 === 0 ? prev + sep + now : prev + now;
            }).split('').reverse().join('') + (dec[1] ? decsep + dec[1] : '');
    };


    scarpa.zeroPaddedNumber = function( number, width ) {

        width -= number.toString().length;

        //if ( width > 0 ) {
        //    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
        //}
        //
        //return number + "";

        return width > 0 ? new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number : number + "";
    };

    return scarpa;
})(scarpa || {});
