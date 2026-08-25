frappe.query_reports["Opportunity Region Offer Report"] = {
    filters: [
        {
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date",
            reqd: 1
        },
        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date",
            reqd: 1
        },
        {
            fieldname: "region",
            label: "Region",
            fieldtype: "Link",
            options: "Territory"
        }
    ],

    onload: function(report) {
        setTimeout(function() {
            add_group_headers();
        }, 500);
    },

    refresh: function(report) {
        setTimeout(function() {
            add_group_headers();
        }, 500);
    }
};


function add_group_headers() {
    let header = $(".dt-header .dt-row");

    if (!header.length) {
        return;
    }

    if ($(".custom-group-header").length) {
        return;
    }

    let row = $(`
        <div class="dt-row custom-group-header">
            <div class="dt-cell" style="width:150px;"></div>

            <div class="dt-cell text-center"
                 style="width:240px; font-weight:bold;">
                Firm
            </div>

            <div class="dt-cell text-center"
                 style="width:270px; font-weight:bold;">
                Bidding
            </div>
        </div>
    `);

    header.first().before(row);
}