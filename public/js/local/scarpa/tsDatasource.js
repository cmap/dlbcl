/**
 * Created by turner on 8/30/15.
 */
var scarpa = (function (scarpa) {

    scarpa.TSDatasource = function (data, collections, cell_lines, tp) {

        if(tp === "ts")
        {
            this.facetNames = ['pert_type', 'collection'];
        }
        else if(tp === "c")
        {
            this.facetNames = ['pert_type', 'collection', 'cmap_class'];
        }

        this.loadDataWithCollections(data, collections, cell_lines);
    };

    scarpa.TSDatasource.prototype.loadDataWithCollections = function (data, collections, cell_lines) {

        var version = scarpa.getQueryVersion();
         var self = this,
            mapped,
            sorted,
            alpha,
            numeric,
            devnull;

        devnull = _.filter(data, function(d){
            return _.size(d.pcls) > 0;
        });

        mapped = _.map(data, function (d, i) {

            var indexed,
                collectioned,
                cellLined,
                faceted,
                co;

            indexed = _.extend(d, { index: i });

            collectioned = (collections) ? self.addCollections(indexed, collections) : indexed;

            cellLined = (cell_lines) ? self.addCellLines(collectioned, cell_lines) : collectioned;

            faceted = self.facetMapping(cellLined);

            return self.tablePresentationMapping(faceted,version);
        });

        sorted = _.sortBy(mapped, 'pert_iname');

        alpha = [];
        numeric = [];
        _.each(sorted, function(d) {

            if ( isNaN( d.pert_iname.charAt(0) ) ) {
                alpha.push(d);
            } else {
                numeric.push(d);
            }

        });

        self.data = alpha.concat(numeric);

        // data dictionary
        self.dictionary = {};
        _.each(self.data, function touchstoneDataDictionary(datum) {
            if(version==='latest') {
               // datum.pert_id = datum.pert_id.toUpperCase();
            }
            var key = datum[ 'pert_id' ];
            self.dictionary[ key ] = _.omit(datum, 'pert_id');
        });

    };

    scarpa.TSDatasource.prototype.addCellLines = function (d, valid_cell_lines) {

        if (d.cell_line_specificity) {

            d.cell_line_specificity_list = _.intersection(valid_cell_lines, _.keys(d.cell_line_specificity));

            if (0 === _.size(d.cell_line_specificity_list)) {
                d.cell_line_specificity_list.push('none_selective');
            }

        } else {

            d.cell_line_specificity_list = [ 'none_selective' ];

        }

        return _.omit(d, 'cell_line_specificity');
    };

    scarpa.TSDatasource.prototype.addCollections = function (d, collections) {

        var subset = _.intersection(_.keys(collections), _.union(d.pert_icollection, (_.size(d.pcls) > 0 ? [ 'pcl' ] : [ 'ignore' ])));

        if (_.size(subset) > 0) {
             d.collection_list = _.values(_.pick(collections, subset));
        }

        return d;
    };

    scarpa.TSDatasource.prototype.facetMapping = function (d) {

        var bit_position;

        d.bitSet = new BitSet;

        // cell line specificity facet
        d.bitSet.set(scarpa.cell_line_specificity_facet_present_bit_position, 1);

        if (d.cell_line_specificity_list) {
            _.each(d.cell_line_specificity_list, function(name){
                bit_position = scarpa[ 'cell_line_specificity_' + name + '_bit_position'];
                d.bitSet.flip(bit_position);
            });
        }

        // collection facet
        if (d.collection_list) {
            d.bitSet.set(scarpa.collection_facet_present_bit_position, 1);
            _.each(d.collection_list, function(name){
                bit_position = scarpa[ 'collection_' + name + '_bit_position'];
                d.bitSet.flip(bit_position);
            });
        }

        // perturbagen facet
        d.pert_type = scarpa.perturbagenTypes[ d.pert_type ];

        bit_position = scarpa[ 'pert_type_' + d.pert_type + '_bit_position'];
        d.bitSet.flip(bit_position);
        d.bitSet.set(scarpa.pert_type_facet_present_bit_position, 1);

        return d;
    };

    scarpa.TSDatasource.prototype.tablePresentationMapping = function (datum,version){

        datum.description_typeahead = createDescriptionWithData(datum);

        if (datum.entrez_geneId) {
            datum.gene_entrez_id_typeahead = datum.entrez_geneId;
        }

        if (_.size(datum.pcls) > 0) {
            datum.pcl_membership_typeahead = createPCLMembershipWithData(datum,version);
        }

        if (_.size(datum.moa) > 0) {
            datum.moa_typeahead = createMechanismOfActionWithData(datum);
        }

        if (_.size(datum.target) > 0) {
            datum.gene_target_typeahead = createGeneTargetWithData(datum);
        }

        if (datum.tas) {
            datum.transcriptional_impact = createTranscriptionalImpactWithData(datum);
        }

        return datum;
    };

    function echoCollectionListWithData(d) {

        var names;

        if (_.size(d.collection_list) > 0 ) {
            names = _.map(d.collection_list, function(collection){ return collection; }).join(', ');
        }

    }

    function createTranscriptionalImpactWithData(d) {

        //return d.tas;

        var value;

        _.each(scarpa.transcriptionalImpactScoreBins, function(bounds, key){

            if (bounds.low <= d.tas && d.tas < bounds.high) {
                value = key + ' (' + d.tas.toFixed(2) + ')';
            }
        });

        return value;
    }

    function createPCLMembershipWithData(d,version) {

        var names;

        names = _.map(_.map(d.pcls, function(pcl){
            return pcl.name;
        }), function(m){
            if(version === "latest"){
                return m;
            }
            var pieces = m.split(' '),
                shorter = pieces.slice(0, (_.size(pieces) - 1));
            return shorter.join(' ');

        });

        return names.join(', ');
    }

    function createGeneTargetWithData(d) {

        if ('cp' === d.pert_type) {
            return (d.target) ? d.target.join(', ') : '-';
        } else {
            return '-';
        }

    }

    function createMechanismOfActionWithData(d) {

        if ('cp' === d.pert_type) {
            return (d.moa) ? d.moa.join(', ') : '-';
        } else {
            return '-';
        }

    }

    function createDescriptionWithData(d) {

        if ('cp' === d.pert_type) {
           // return (d.moa) ? d.moa.join(', ') : '-';
            return (d.moa) ? _.first(d.moa) : '-';
           // return '-';
        } else {
            return (d.gene_family) ? _.first(d.gene_family) : '-';
        }

    }

    return scarpa;
})(scarpa || {});
