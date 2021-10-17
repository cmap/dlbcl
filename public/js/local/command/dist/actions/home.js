exports.show = function(options) {
    var html = [];
    html.push('<div class="col-xs-12">');
    html.push(
        '<p>The CLUE Command App offers rapid answers to specific scientific questions on perturbagens, genes, connectivities, and metadata in the Connectivity Map dataset. View all available commands by typing “/” in the search bar above, and you can return to this page at any time by using the /home command.');
    html.push('<h4>Featured Command</h4>');
    html.push('<code>/gene-space</code>');
    html.push('<br />');
    html.push(
        'Search for a specific gene of interest, set of genes, or browse all of the genes that are either measured directly in L1000 assay or inferred. For more information on Landmark Genes and gene inference in L1000, please see Connectopedia, the CLUE Knowledge Base.');

    html.push('<h4>Core Commands</h4>');
    html.push('<code>/moa</code>');

    html.push('<br />');
    html.push(
        'Use this command to view the mechanism of action (MoA) for small-molecule perturbagens. Alternatively, you can use a gene name or MoA as an input to view the MoAs of all compounds that target genes or all compounds that belong to that MoA, respectively.');

    html.push('<br />');
    html.push('<br />');
    html.push('<code>/target</code>');
    html.push('<br />');

    html.push(
        'Use this command to view the targets of small-molecule perturbagens. Alternatively, you can use a gene name or target name as an input to either view the targets of all compounds that target genes or all compounds that belong to that target class, respectively.');
    html.push('</p>');
    html.push('</div>');
    options.$el.addClass('cmd-message');
    options.$el.html(html.join(''));
};