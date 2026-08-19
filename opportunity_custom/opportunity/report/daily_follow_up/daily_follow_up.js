frappe.query_reports["Daily Follow Up"] = {
    filters: [
        {
            fieldname: "sales_person",
            label: "Sales Person",
            fieldtype: "Link",
            options: "Sales Person"
        },
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
        }
    ]
};