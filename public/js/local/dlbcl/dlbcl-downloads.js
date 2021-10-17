class DLBCLDownload {
    /**
     *
     */
    constructor(unsigned_urls, signed_urls,config) {
        this.unsigned_urls = unsigned_urls;
        this.signed_urls = signed_urls;
        this.config = config;
        this.searchResultsTable = null;
        this.filterManager = null;
        this.$c5 = $('#c5');
        this.$c6 = $('#c6');
        this.$c7 = $('#c7');
        this.$card = $('<div></div>').addClass('empty-card');
        $('<span class="empty-card-instructions">Select an item </br> for more information</span>').appendTo(this.$card);
        this.$card.appendTo(this.$c7);
        this.$tableDiv = $('<div></div>');
        this.$tableDiv.appendTo(this.$c6);
    }

    /**
     * @param data
     * @returns {Promise<string>}
     */
    async build() {
        const self = this;
        await Promise.all[self.addTable(self.unsigned_urls), self.addHTML()];
        return "done";
    }



    /**
     *
     * @returns {Promise<void>}
     */
    async addTable(data) {
        const self = this;
        self.searchResultsTable = new tablelegs.Table({
            search: true,
            showAll: false,
            export: false,
            exportFileName: "export.txt",
            $el: self.$tableDiv,
            items: data,
            columns: [
                {
                    name: 'Name',
                    field: 'name',
                    visible: true
                },
                {
                    name: 'Description',
                    field: 'description',
                    visible: true
                },
                {
                    name: 'File Type',
                    field: 'type',
                    visible: true
                }
            ]
        });

        self.searchResultsTable.setSortColumns([{
            name: 'File Type',
            ascending: false
        }]);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async addHTML() {
        const self = this;
        self.$tableDiv.find('[data-name="showAll"]').remove();
        let $header = $('');

        self.$tableDiv.find('[data-name=buttons]').append("&nbsp;");
        $header.appendTo(self.$tableDiv.find('[data-name=buttons]'));

        let $searchInput = self.$tableDiv.find('[name=searchInput]');
        $searchInput.attr('placeholder', 'Search All Fields').addClass('rep-ubersearch').prependTo(self.$c6);
        let searchingTable = false;

        $('#export_button').click(function () {
            self.searchResultsTable.exportTable();
        });
        self.searchResultsTable.on('filter', function () {
            //searchingTable = true;
            // update facets
            searchingTable = false;
        });

        self.searchResultsTable.on('selectionChanged', function (e) {
            let selectedRows = e.selectedRows;
            if (selectedRows.length > 0) {
                let selectedItem = self.searchResultsTable.getItems()[selectedRows[0]];
                if (selectedItem) {
                    self.dataCard(selectedItem);
                }
            }
        });

        $(window).on('resize orientationchange', function () {
        });
    }

    /**
     *
     * @param item
     */
    dataCard(item) {
        const results = clue.DLBCLDownloadCard(item);
         $("#c7").html(results.payload);
         $("#c7").css("display", "block");
        //display the previous tab
        const clueTab = $("#tab_census_db").attr('data-clue-tab');
         $('.nav-tabs a[data-clue-id="' + clueTab + '"]').tab('show');
    }
}