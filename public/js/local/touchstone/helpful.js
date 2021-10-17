/**
 * Created by turner on 8/30/15.
 */
var scarpa = (function (scarpa) {


    scarpa.facetBitSetWithCategoryAndBitPosition = function (facet, categories, bitPosition) {

        var obj = {},
            first,
            last;

        _.each(categories, function(category) {
            obj[ facet + '_' + category + '_bit_position' ] = bitPosition++;
        });

        obj[ facet + '_bitmask' ] = new BitSet;
        first = obj[ facet + '_' + _.first(categories) + '_bit_position' ];
        last = obj[ facet + '_' + _.last(categories) + '_bit_position' ];
        obj[ facet + '_bitmask' ].setRange(first, last, 1);

        obj[ facet + '_facet_present_bitmask' ] = new BitSet;
        obj[ facet + '_facet_present_bit_position' ] = 1 + obj[ facet + '_' + _.last(categories) + '_bit_position' ];
        obj[ facet + '_facet_present_bitmask' ].flip(obj[ facet + '_facet_present_bit_position' ]);

        obj[ facet + '_facet_all_unchecked_bitmask' ] = obj[ facet + '_facet_present_bitmask' ].clone();

        return obj;
    };

    scarpa.facetNamesForFacetSelection = function ($filters) {

        var names = [];
        $filters.find('input').each(function(){
            names.push( $( this ).attr('name') );
        });

        return _.uniq(names);
    };

    scarpa.queryTableURL = function (d) {
        var pert_id = d.pert_id;
        var url = '/connection?' + 'url=' + scarpa.touchstone_root_directory + "/" + pert_id;
        return encodeURI(url);
    };

    scarpa.connectionURLList = function (d, index) {
        var pert_id = d.pert_id;

        return (0 === index) ? encodeURI('/connection?' + 'url=' + scarpa.touchstone_root_directory + "/" + pert_id) : encodeURI('?select=' + scarpa.touchstone_root_directory + "/" + pert_id);
    };

    return scarpa;
})(scarpa || {});
