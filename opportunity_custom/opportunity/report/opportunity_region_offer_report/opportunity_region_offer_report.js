frappe.query_reports["Opportunity Region Offer Report"] = {

    filters: [

        {
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.month_start()
        },

        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.get_today()
        },

        {
            fieldname: "region",
            label: "Region",
            fieldtype: "Link",
            options: "Territory"
        }

    ]
};