/**
 * Created by turner on 8/30/15.
 */
var scarpa = (function (scarpa) {

    scarpa.FilterEngine = function ($filters) {

        var self = this;

        this.facetNames = scarpa.facetNamesForFacetSelection($filters);
        this.facets = {};

        _.each(this.facetNames, function(name){
            var $input = "input[name=" + name + "]:checkbox";
            self.facets[ name ] = $filters.find($input);
        });

        this.facetCounter = this.initializeFacetCount(this.facets);

    };

    scarpa.FilterEngine.prototype.evaluate = function(data) {

        var self = this,
            filtered,
            facetBitSet,
            facet_names_checked,
            facet_rejections,
            counter_acceptence,
            counter_rejection,
            searchFilter,
            searched;

        if (undefined === data) {
            scarpa.touchstoneTable.updateData(data);
            return;
        }

        searchFilter = scarpa.touchstoneTable.table.getFilter().get(0);
        searched = _.filter(data, function(d){

            if (searchFilter.isEmpty()) {
                return true;
            } else {
                return searchFilter.accept(d);
            }

        });

        // bit vector corresponding to facet checkbox settings (checked/unchecked)
        facetBitSet = bitSetWithFacets(this.facets);

        // isolate facet names that are checked. Ignore the others which always return true.
        facet_names_checked = _.filter(scarpa.touchstoneDatasource.facetNames, function(facet_name){

            var facet_unchecked = facetBitSet.clone();
            facet_unchecked.and(scarpa[ facet_name + '_facet_all_unchecked_bitmask']);

            return facet_unchecked.isEmpty();
        });

        // initialize the facet counters
        _.each(self.facetCounter, function(facet){
            _.each(facet, function(val, key){
                facet[ key ].numer = 0;
            });
        });

        counter_acceptence = counter_rejection = 0;
        filtered = _.filter(searched, function(d) {

            var acceptance,
                rejectionFacets;

            // record facets that trigger datum rejection
            rejectionFacets = new BitSet;

            // filter return value
            acceptance = true;

            _.each(facet_names_checked, function(facet_name, i) {

                var isFacetPresentInDatum,
                    facetCategory,
                    datumFacetCategory;

                // bit vector indicates presence/absence of facet
                isFacetPresentInDatum = d.bitSet.clone();
                isFacetPresentInDatum.and(scarpa[ facet_name + '_facet_present_bitmask']);

                // if datum lacks facet, reject it and record rejecting facet
                if ( isFacetPresentInDatum.isEmpty() ) {
                    acceptance = false;
                    rejectionFacets.set(i);
                } else {

                    // isolate facet
                    facetCategory = facetBitSet.clone();
                    facetCategory.and(scarpa[ facet_name + '_bitmask' ]);

                    // isolate datum facet category
                    datumFacetCategory = d.bitSet.clone();
                    datumFacetCategory.and(scarpa[ facet_name + '_bitmask']);

                    // AND datum and facet. An empty results is a rejection
                    // record rejecting facet
                    if (facetCategory.and(datumFacetCategory).isEmpty()) {
                        acceptance = false;
                        rejectionFacets.set(i);
                    }

                }

            }); // _.each(facet_names_checked ... )

            // if datum survives filtering, increment ALL applicable facet categories
            if (true === acceptance) {

                ++counter_acceptence;

                _.each(scarpa.touchstoneDatasource.facetNames, function(facet_name){

                    if (d[ facet_name + '_list' ]) {

                        _.each(d[ facet_name + '_list' ], function(category){
                            self.facetCounter[ facet_name ][ category ].numer += 1;
                        });

                    } else if (d[ facet_name ]) {

                        self.facetCounter[ facet_name ][ d[ facet_name ] ].numer += 1;

                    }
                });

            } else {

                ++counter_rejection;

                // increment facet counters for facets that cause a datum to be rejected.

                // list the facets that reject the datum
                facet_rejections = facet_rejectors(rejectionFacets);

                // ignore the facet categories being counted. if NO rejecting facets remain, increment the counter.
                _.each(facet_rejections, function(facet_name){

                    if (d[ facet_name + '_list' ]) {

                        if (0 === _.size( _.without(facet_rejections, facet_name) )) {
                            _.each(d[ facet_name + '_list' ], function(category){
                                self.facetCounter[ facet_name ][ category ].numer += 1;
                            });
                        }

                    } else if (d[ facet_name ]) {

                        if (0 === _.size( _.without(facet_rejections, facet_name) )) {
                            self.facetCounter[ facet_name ][ d[ facet_name ] ].numer += 1;
                        }

                    }

                });

            }

            // retrieve facet names corresponding to facet rejection bit vector
            function facet_rejectors(bits) {

                var result = [];
                _.each(bits.toArray(), function(index){
                    result.push(facet_names_checked[ index ]);
                });

                return result;
            }

            return acceptance;

        }); // _.filter(searched ... )

        scarpa.touchstoneTable.updateData(filtered);

        _.each(self.facets, function($facet){

            $facet.each(function(){

                var name = $(this).attr('name'),
                    value = $(this).attr('value'),
                    $label = find$Label($( this ));

                $label.find('span').text( '(' + self.facetCounter[ name ][ value ].numer + '/' + self.facetCounter[ name ][ value ].denom + ')' );

            });

        });

    };

    scarpa.FilterEngine.prototype.initializeFacetCount = function (facets) {

        var hash = {};

        _.each(facets, function($facet){

            $facet.each(function(){

                var checkbox_group = $(this).attr('name'),
                    value = $(this).attr('value');

                if (undefined === hash[ checkbox_group ]) {
                    hash[ checkbox_group ] = {};
                }
                hash[ checkbox_group ][ value ] = { numer:0, denom:0 };
            });
        });

        return hash;
    };

    scarpa.FilterEngine.prototype.updateFacetCount = function (data) {

        var self = this;

        _.each(self.facetCounter, function(facet){

            _.each(facet, function(val, key){
                facet[ key ].numer = facet[ key ].denom = 0;
            });

        });

        _.each(data, function(d){

            _.each(self.facetCounter, function(facet, facet_name){

                if (d[ facet_name + '_list' ]) {

                    _.each(d[ facet_name + '_list' ], function(category){
                        facet[ category ].numer += 1;
                        facet[ category ].denom += 1;
                    });

                } else if (d[ facet_name ]) {
                    facet[ d[ facet_name ] ].numer += 1;
                    facet[ d[ facet_name ] ].denom += 1;
                }

            });

        });

        _.each(self.facets, function($facet){

            $facet.each(function(){

                var name = $(this).attr('name'),
                    value = $(this).attr('value'),
                    $label = find$Label($( this ));

                $label.find('span').text( '(' + self.facetCounter[ name ][ value ].numer + '/' + self.facetCounter[ name ][ value ].denom + ')' );

            });
        });

    };

    scarpa.FilterEngine.prototype.unselectAllFilters = function () {

        var self = this;

        _.each(this.facetNames, function( name ){

            self.facets[ name ].each(function(){

                var $label = find$Label($( this ));

                $label.find('span').text( '(' + 0 + ')' );
                $( this ).prop('checked', false);

            });
        });

        this.evaluate(scarpa.touchstoneDatasource.data);

    };

    scarpa.FilterEngine.prototype.search = function(data, query) {

        var matches,
            REs = [],
            success;

        REs = scarpa.regularExpressionsWithSearchQuery(query);
        matches = _.filter(data, function(datum){

            var tokens = [],
                concatenation;

            tokens.push(datum.pert_type);
            tokens.push(datum.pert_id);
            tokens.push(datum.pert_iname);
            tokens.push(datum.description_typeahead);

            if (datum.entrez_geneId) {
                tokens.push(datum.entrez_geneId);
            }

            if (datum.moa_typeahead) {
                tokens.push(datum.moa_typeahead);
            }

            if (datum.gene_target_typeahead) {
                tokens.push(datum.gene_target_typeahead);
            }

            tokens.push(datum.pcl_membership_typeahead);

            concatenation = tokens.join(' ');

            success = false;
            _.each(REs, function(re){

                if (false === success && re.test(concatenation)) {
                    success = true;
                 }
            });

            return success;

        });

        return _.size(matches) > 0 ? matches : undefined;

    };

    function bitSetWithFacets(facets) {

        var bitSet = new BitSet;

        _.each(facets, function($facet, key){

            var property;

            if (isFacetUnchecked($facet)) {
                property = key + '_facet_all_unchecked_bitmask';
                bitSet.or(scarpa[ property ]);
            } else {

                $facet.each(function(){

                    var facet = $(this).attr('name'),
                        item = $(this).attr('value');

                    property = facet + '_' + item + '_bit_position';
                    if ( $(this).prop('checked') ) {
                        bitSet.flip( scarpa[ property ] );
                    }
                });
            }
        });

        return bitSet;
    }

    function isFacetUnchecked($facet) {

        var result = true;

        $facet.each(function(){
            if (true === result) {
                if (true === $(this).prop('checked')) {
                    result = false;
                }
            }
        });

        return result;
    }

    function find$Label($input) {

        var la = "label[" + "for=" + "\"" + $input.attr('id') + "\"" + "]",
            $la;

        if ('favorite' === $input.attr('id')) {
            $la = scarpa.$filter_favorite_label;
        } else {
            $la = $( la );
        }

        return $la;
    }

    return scarpa;
})(scarpa || {});
